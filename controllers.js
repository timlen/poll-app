var express = require('express');
var router = express.Router();

var request = require('request'),
    mongoose = require('mongoose');

var Poll = mongoose.model('Poll', {
    question: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    choices: {
        type: [],
        required: true
    },
    voters: {
        type: [],
        required: true
    },
    tliId: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    }
});

router.get('/init', function(req, resp, next) {
    request((process.env.API_URL || 'http://localhost:5000/api') + '/auth', function(err, response, body) {
        if(err) {
            return next(err);
        }

        var userData = JSON.parse(body);

        req.session.userData = userData;

        resp.send(userData);
    });
});

router.get('/poll/:tliId', function(req, resp, next) {
    Poll.findOne({tliId: req.params.tliId}, function(err, poll) {
        if(err) {
            return next(err);
        }

        if(!poll) {
            return resp.send({});
        }

        poll.choices.forEach(function(choice) {
            delete choice.votes;
        });

        resp.send({
            question: poll.question,
            description: poll.description,
            choices: poll.choices,
            tliId: poll.tliId,
            teacherId: poll.teacherId,
            hasVoted: poll.voters.indexOf(req.session.userData.userId) === 0
        });
    });
});

router.put('/poll/:tliId', function(req, resp, next) {
    if(req.session.userData.userType === 'teacher') {
        var pollData = {
            question: req.body.question,
            description: req.body.description,
            choices: req.body.choices
        };

        Poll.findOneAndUpdate({tliId: req.params.tliId}, pollData, {upsert: true}, function(err, updatedPoll) {
            if(err) {
                return next(err);
            }

            resp.send(updatedPoll);
        });
    } else {
        resp.send('Not allowed');
    }
});

router.get('/results/:tliId', function(req, resp, next) {
    if(req.session.userData.userType === 'teacher') {
        Poll.findOne({tliId: req.params.tliId}, function(err, poll) {
            if(err) {
                return next(err);
            }

            if(!poll) {
                return resp.send({
                    question: '',
                    description: '',
                    choices: [{title: '', votes: 0}, {title: '', votes: 0}, {title: '', votes: 0}],
                    tliId: req.params.tliId,
                    teacherId: req.session.userData.userId
                });
            }

            resp.send(poll);
        });
    } else {
        resp.send('Not allowed');
    }
});

router.post('/vote/:tliId', function(req, resp, next) {
    Poll.findOne({tliId: req.params.tliId}, function(err, poll) {
        if(err) {
            return next(err);
        }

        if(poll.voters.indexOf(req.session.userId) === 0) {
            resp.send('Already voted');
        } else {
            poll.voters.push(req.session.userId);

            poll.choices.forEach(function(choice) {
                if(choice.title === req.body.title) {
                    choice.votes++;
                }
            });
            poll.markModified('choices');

            poll.save(function(err) {
                if(err) {
                    return next(err);
                }

                resp.send('ok');
            });
        }
    });
});

module.exports = router;
