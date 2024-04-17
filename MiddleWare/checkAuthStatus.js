const model = require("../Models/model");

const bcrypt = require("bcrypt");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        throw new ExpressError("User not logged in", 401);
    } else {
        console.log("user is logged in");
        next();
    }
};


module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.session;
    const recipe = await Recipe.findById(id);
    if (!recipe) {
        throw new ExpressError("Document not found", 404);
    }
    if (!recipe.author.equals(userId)) {
        throw new ExpressError(
            "You are not authorized to perform this action",
            403
        );
    }
    console.log("user is the author of the game");
    next();
};

module.exports.areCredentialsVerified = async (req, res, next) => {
    const { username, password } = req.body.user;
    const user = await model.Uzivatel.findOne({ where: { Jmeno: username } });
    if (!user) {
        return res.status(400).json({ error: 'Uživatel neexistuje.' });
    }

    const loginInfo = await model.PrihlasovaciUdaje.findByPk(user.PrihlasovaciUdajeID);
    const isMatch = await bcrypt.compare(password, loginInfo.Heslo);
    if (!isMatch) {
        return res.status(400).json({ error: 'Nesprávné heslo.' });
    }
    req.user = user; 
    next();
};