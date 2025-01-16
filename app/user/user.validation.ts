
import { body } from 'express-validator';

export const createUser = [
    body('name').notEmpty().withMessage('name is required').isString().withMessage('name must be a string'),
    body('email').notEmpty().withMessage('email is required').isString().withMessage('email must be a string'),
    body('active').isBoolean().withMessage('active must be a boolean'),
    body('password').notEmpty().withMessage('password is required').isString().withMessage('password must be a string'),
];

export const loginUser = [
    body('email').notEmpty().withMessage('email is required').isString().withMessage('email must be a string'),
    body('password').notEmpty().withMessage('password is required').isString().withMessage('password must be a string'),
]

// export const updateUser = [
//     body('name').notEmpty().withMessage('name is required').isString().withMessage('name must be a string'),
//     body('email').notEmpty().withMessage('email is required').isString().withMessage('email must be a string'),
//     body('active').isBoolean().withMessage('active must be a boolean'),
//     body('password').notEmpty().withMessage('password is required').isString().withMessage('password must be a string'),
// ];

// export const editUser = [
//     body('name').isString().withMessage('name must be a string'),
//     body('email').isString().withMessage('email must be a string'),
//     body('active').isBoolean().withMessage('active must be a boolean'),
//     body('password').isString().withMessage('password must be a string'),
// ];
