const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title cannot be empty'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
        type: String,
        required: [true, 'Description cannot be empty'],
        trim: true
    },
    difficulty: {
        type: String,
        enum: {
            values: ['easy', 'medium', 'hard'],
            message: 'Difficulty must be easy, medium, or hard'
        },
        required: [true, 'Difficulty cannot be empty'],
        default: 'easy',
        lowercase: true
    },
    testCases: {
        type: [{
            input: {
                type: String,
                required: [true, 'Test case input is required'],
                trim: true
            },
            output: {
                type: String,
                required: [true, 'Test case output is required'],
                trim: true
            }
        }],
        validate: {
            validator: function(arr) {
                return arr && arr.length > 0;
            },
            message: 'At least one test case is required'
        }
    },
    codeStubs: {
        type: [{
            language: {
                type: String,
                required: [true, 'Language is required'],
                trim: true,
                lowercase: true
            },
            startSnippet: {
                type: String,
                trim: true
            },
            userSnippet: {
                type: String,
                default: '',
                trim: true
            },
            endSnippet: {
                type: String,
                trim: true
            }
        }],
        validate: {
            validator: function(arr) {
                return arr && arr.length > 0;
            },
            message: 'At least one code stub is required'
        }
    },
    editorial: {
        type: String,
        default: '',
        trim: true
    }
}, {
    timestamps: true,
    strict: true
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;