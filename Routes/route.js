const express = require('express')
const router = express.Router()
const controller = require('../Controllers/controller')
const catchAsync = require('../utils/catchAsync');
const { areCredentialsVerified, isLoggedIn } = require('../MiddleWare/checkAuthStatus');

const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./public/images/uploads");
    },
    filename: function (req,file,cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const upload = multer ({
    storage: storage,
}).single("obrazek");

router.route('/')
.get(controller.getAllGameIndex)

router.route('/library')
.get(controller.getAllGameLibrary)

router.route('/addCash')
.post(controller.addCash)

router.route('/detail/:id')
.get(catchAsync(controller.showGameDetail))
.patch(isLoggedIn, upload ,catchAsync(controller.updateGame))
.delete(isLoggedIn, catchAsync(controller.deleteGame))

router.route('/detail/:id/edit')
.get(catchAsync(controller.renderEditGame))

router.route('/add')
.get(catchAsync(controller.renderAddGameIndex))
.post(isLoggedIn ,upload,catchAsync(controller.addGameIndex))

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