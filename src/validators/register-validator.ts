import { checkSchema } from 'express-validator'

export default checkSchema({
    firstName: {
        errorMessage: 'FirstName is required!',
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: 'LastName is required!',
        notEmpty: true,
        trim: true,
    },
    email: {
        errorMessage: 'Email is required!',
        notEmpty: true,
        trim: true,
    },
    password: {
        errorMessage: 'Password is required!',
        notEmpty: true,
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password should be at least 8 chars',
        },
    },
})
