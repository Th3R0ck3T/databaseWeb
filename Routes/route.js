const express = require('express')
const router = express.Router()
const controller = require('../Controllers/controller')
const catchAsync = require('../utils/catchAsync');
const { areCredentialsVerified, isLoggedIn } = require('../MiddleWare/checkAuthStatus');

router.route('/')
.get(controller.getAllGameIndex)

router.route('/library')
.get(controller.getAllGameLibrary)

router.route('/add')
.get(controller.renderAddGameIndex)
.post(controller.addGameIndex)

router.route('/register')
.get(controller.getRegisterPage)
.post(controller.registerUser)

router.route('/login')
.get(controller.getLoginPage)
.post(catchAsync(areCredentialsVerified),catchAsync(controller.loginUser))

router.route('/developerMode')
.get(controller.toggleDeveloper)

router.route('/logout').get(controller.logoutUser)






module.exports = router;