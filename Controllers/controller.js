const sql = require('mssql');
const bcrypt = require('bcrypt');
const model = require('../Models/model');


exports.getAllGameIndex = async (req, res) => {
    new sql.Request().query('SELECT * FROM Hra', (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('index', { games: result.recordset });
    });
};

exports.getAllGameLibrary = async (req, res) => {
    res.render('library');
}

exports.renderAddGameIndex = async (req, res) => {
    res.render('add');
}

exports.addGameIndex = async (req, res) => {
    const { nadpis, detail, cena } = req.body.game;
    const category = req.body.category;
    console.log(req.body.category)
    try {
        
        // Vytvoření hry v databázi
         await model.Hra.create({
            Jmeno: nadpis,
            Popis: detail,
            Cena: cena,
            Kategorie: category,
            DatumVzniku: new Date()
        });

        res.status(201).redirect('/');
    } catch (error) {
        console.error('Chyba při přidávání hry:', error);
        res.status(500).json({ message: 'Nastala chyba při zpracování požadavku.' });
    }
};


exports.renderEditGame = async (req, res) => {
    res.render('edit');
}

exports.updateGame = async (req, res) => {

}

exports.deleteGame = async (req, res) => {
    
}
exports.showGameDetail = async (req, res) => {
    res.render('detail')
}



// Authentication

exports.getRegisterPage = (req, res) => {
    res.render("register");
};

exports.getLoginPage = (req, res) => {
    res.render("login");
};


exports.registerUser = async (req, res) => {
    const { username, password, email } = req.body.user;

    try {

        const hashedPassword = await bcrypt.hash(password, 10);
        // Vytvoření přihlašovacích údajů
        const createdLogin = await model.PrihlasovaciUdaje.create({
            Jmeno: username,
            Heslo: hashedPassword, // heslo by mělo být již hashované, pokud používáte bcrypt
            DatumVzniku: new Date()
        });

        // Vytvoření uživatele s odkazem na vytvořené přihlašovací údaje
        await model.Uzivatel.create({
            Jmeno: username,
            Mail: email,
            DatumVzniku: new Date(),
            PrihlasovaciUdajeID: createdLogin.PrihlasovaciUdajeID
        });
        // Odeslání výsledků jako odpověď
        const user = await model.Uzivatel.findOne({ where: { Jmeno: username } });
        req.session.userId = user.UzivatelID;
        req.session.username = username;

        res.status(302).redirect('/');        
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Nepodařilo se zaregistrovat uživatele' });
    }
};



exports.loginUser = async (req, res) => {
    const { username, password } = req.body.user;
    try {
        // Najdi uživatele podle uživatelského jména
        const user = await model.Uzivatel.findOne({ where: { Jmeno: username } });

        if (!user) {
            return res.status(400).json({ error: 'Nesprávné uživatelské jméno nebo heslo' });
        }

        // Získání přihlašovacích údajů uživatele
        const loginInfo = await model.PrihlasovaciUdaje.findByPk(user.PrihlasovaciUdajeID);

        // Porovnání hesla
        const passwordMatch = await bcrypt.compare(password, loginInfo.Heslo);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Nesprávné uživatelské jméno nebo heslo' });
        }

        // Přihlášení úspěšné, ulož do session
        req.session.userId = user.UzivatelID;
        req.session.username = username;
       

        res.status(302).redirect('/');
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Nepodařilo se přihlásit uživatele' });
    }
};

exports.toggleDeveloper = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await model.Uzivatel.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Uživatel nenalezen' });
        }

        // Změna hodnoty vyvojar
        user.Vyvojar = user.Vyvojar === true ? false : true;
         req.session.isVyvojar = user.Vyvojar;
        await user.save();

        res.status(200).redirect('/');
    } catch (error) {
        console.error('Chyba při přepínání módu vývojáře:', error);
        res.status(500).json({ error: 'Nastala chyba při zpracování požadavku.' });
    }
}

exports.logoutUser = (req, res) => {
    // delete session
    console.log("deleting session cookie");
    req.session.userId = null;
    req.session.save((err) => {
        if (err) next(err);
        req.session.regenerate((err) => {
            if (err) next(err);
            res.redirect("/");
        });
    });
};





