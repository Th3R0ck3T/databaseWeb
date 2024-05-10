const express = require('express')
const router = express.Router()
const controller = require('../Controllers/controller')
const catchAsync = require('../utils/catchAsync');
const { areCredentialsVerified, isLoggedIn } = require('../MiddleWare/checkAuthStatus');

router.route('/')
.get(controller.getAllGameIndex)

router.route('/library')
.get(controller.getAllGameLibrary)

router.route('/addCash')
.post(controller.addCash)

router.route('/detail/:id')
.get(catchAsync(controller.showGameDetail))
.patch(catchAsync(controller.updateGame))
.delete(catchAsync(controller.deleteGame))

router.route('/detail/:id/edit')
.get(catchAsync(controller.renderEditGame))

router.route('/add')
.get(controller.renderAddGameIndex)
.post(controller.addGameIndex)

router.route('/buy/:id')
.post(controller.buyGame)

router.route('/borrow/:id')
.post(controller.borrowGame)


router.route('/register')
.get(controller.getRegisterPage)
.post(controller.registerUser)

router.route('/login')
.get(controller.getLoginPage)
.post(catchAsync(areCredentialsVerified),catchAsync(controller.loginUser))

router.route('/developerMode')
.get(controller.toggleDeveloper)

router.route('/logout').get(controller.logoutUser)

router.route('/logs').get(controller.getLogs)

module.exports = router;