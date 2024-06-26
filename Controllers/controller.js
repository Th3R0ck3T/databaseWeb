const sql = require('mssql');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const model = require('../Models/model');

const admin = "admin"
const adminPassword = "admin";

async function logUserLogin(username) {
    try {
        const request = new sql.Request();

        // Volání uložené procedury LogUserLogin s parametrem username
        await request.input('UserName', sql.NVarChar(50), username)
                     .execute('LogUserLogin');
    console.log("stala se procedura")
    } catch (error) {
        console.error('Error logging user login:', error);
    }
}

exports.getLogs = async (req, res) =>{
    try {
        const logs = await model.Logins.findAll({});

        res.render('logs', { logs });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

exports.getAllGameIndex = async (req, res) => {
    try {
    
        let games = [];
        // Získání her z databáze SQL
        const sqlResult = await new sql.Request().query('SELECT * FROM Hra');

        // Pokud je uživatel přihlášený, načteme seznam zakoupených her
        if (req.session.userId) {
            const seznamHer = await model.SeznamHer.findAll({ where: { UzivatelID: req.session.userId } });

            // Kombinace výsledků
            games = sqlResult.recordset.map(hra => {
                const isBought = seznamHer.some(item => item.HraID === hra.HraID);
                return { ...hra, Koupena: isBought };
            });
        } else {
            // Pokud není uživatel přihlášený, pouze načteme hry z databáze
            games = sqlResult.recordset.map(hra => ({ ...hra, Koupena: false }));
        }

        // Odeslání výsledků
        res.render('index', { games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).send('Internal Server Error');
    }

};

exports.getAllGameLibrary = async (req, res) => {
    try {
        // Získání všech her v knihovně uživatele
        const uzivatel = await model.Uzivatel.findByPk(req.session.userId);
        if (!uzivatel) {
            return res.status(404).json({ error: 'Uživatel nenalezen' });
        }
        const games = await model.SeznamHer.findAll({ where: { UzivatelID: req.session.userId }, include: [{ model: model.Hra }] });

        res.render('library', { games, uzivatel });
    } catch (error) {
        console.error('Error fetching games from library:', error);
        res.status(500).json({ error: 'Nastala chyba při získávání her z knihovny uživatele' });
    }
}

exports.addCash = async (req, res) => {
    try {
        const userId = req.session.userId; // ID přihlášeného uživatele
        const amountToAdd = parseFloat(req.body.amount); // Částka k přidání, získaná z požadavku

        // Validace vstupních dat
        if (!userId || isNaN(amountToAdd) || amountToAdd <= 0) {
            return res.status(400).json({ error: 'Neplatné vstupní údaje' });
        }

        // Získání uživatele z databáze
        const user = await model.Uzivatel.findByPk(userId);

        // Pokud uživatel neexistuje, vrátíme chybu 404
        if (!user) {
            return res.status(404).json({ error: 'Uživatel nenalezen' });
        }

        // Přidání finančních prostředků na účet uživatele
        user.Zustatek += amountToAdd;

        // Uložení změn v databázi
        await user.save();

        // Odpověď s potvrzením o úspěšném přidání finančních prostředků
        res.status(200).redirect('/library');
    } catch (error) {
        console.error('Chyba při přidávání finančních prostředků na účet:', error);
        res.status(500).json({ error: 'Nastala chyba při přidávání finančních prostředků na účet' });
    }
}

exports.showGameDetail = async (req, res) => {
    try {
        // Získání ID hry z parametrů URL
        const gameId = req.params.id;

        // Získání hry z databáze SQL
        const sqlResult = await new sql.Request().query(`SELECT * FROM Hra WHERE HraID = ${gameId}`);
        const author = await model.VyvojarHra.findOne({ where: {HraID: gameId}});
        // Pokud hra neexistuje, vrátíme chybu 404
        if (sqlResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Hra nenalezena' });
        }

        let isBought = false;

        // Pokud je uživatel přihlášený, zjistíme, zda je tato hra zakoupena
        if (req.session.userId) {
            const seznamHer = await model.SeznamHer.findOne({ where: { UzivatelID: req.session.userId, HraID: gameId } });
            isBought = seznamHer !== null;
        }

        // Vytvoření objektu hry s informací o tom, zda je zakoupena
        const game = { ...sqlResult.recordset[0], Koupena: isBought };

        const reviews = await model.Recenze.findAll({ where: { HraID: gameId } });
        // Odeslání výsledků do šablony pro detail hry
        res.render('detail', { game, reviews, author });
    } catch (error) {
        console.error('Chyba při získávání detailů hry:', error);
        res.status(500).json({ error: 'Nastala chyba při získávání detailů hry' });
    }
}

exports.renderAddGameIndex = async (req, res) => {
    res.render('add');
}

exports.addGameIndex = async (req, res) => {
    const { nadpis, detail, cena } = req.body.game;
    const category = req.body.category;
    const userId = req.session.userId; // Získání ID přihlášeného uživatele
    let obrazek = null;
    if(req.file){
        obrazek = req.file.filename;
    }
    try {
        // Vytvoření hry v databázi
        const newGame = await model.Hra.create({
            Jmeno: nadpis,
            Popis: detail,
            Cena: cena,
            Kategorie: category,
            Obrazek: obrazek,
            DatumVzniku: new Date()
        });

        // Pokud se hra úspěšně vytvořila, uložíme vztah mezi uživatelem a hrou do tabulky VyvojarHra
        if (newGame) {
            await model.VyvojarHra.create({
                UzivatelID: userId,
                HraID: newGame.HraID
            });
        }

        res.status(201).redirect('/');
    } catch (error) {
        console.error('Chyba při přidávání hry:', error);
        res.status(500).json({ message: 'Nastala chyba při zpracování požadavku.' });
    }
};


exports.renderEditGame = async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId = req.session.userId; // Získání ID přihlášeného uživatele
        const game = await model.Hra.findByPk(gameId);

        if (!game) {
            return res.status(404).json({ error: 'Hra nenalezena' });
        }

        // Zkontrolujte, zda je přihlášený uživatel tvůrcem hry
        const isAuthor = await model.VyvojarHra.findOne({ where: { UzivatelID: userId, HraID: gameId } });

        if (!isAuthor) {
            return res.status(403).json({ error: 'Nemáte oprávnění k úpravě této hry' });
        }

        res.render('edit', { game: game }); // Předání informací o hře do šablony detailů
    } catch (error) {
        console.error('Chyba při získávání detailů hry:', error);
        res.status(500).json({ error: 'Nastala chyba při získávání detailů hry' });
    }
}

exports.updateGame = async (req, res) => {
    const gameId = req.params.id;
    const userId = req.session.userId; // Získání ID přihlášeného uživatele
    const { nadpis, detail, cena } = req.body.game;
    const category = req.body.category;
    let obrazek = null;
    if (req.file) {
        obrazek = req.file.filename;
    } 
    try {
        // Najděte hru podle ID
        const game = await model.Hra.findByPk(gameId);

        if (!game) {
            return res.status(404).json({ error: 'Hra nebyla nalezena' });
        }


        if (game.Obrazek) {
            const imagePath = path.join(__dirname, '../Public/images/uploads', game.Obrazek);
            if(fs.existsSync(imagePath)){
                fs.unlinkSync(imagePath); 
            } 
        }
        
       
        // Zkontrolujte, zda je přihlášený uživatel tvůrcem hry
        const isAuthor = await model.VyvojarHra.findOne({ where: { UzivatelID: userId, HraID: gameId } });

        if (!isAuthor) {
            return res.status(403).json({ error: 'Nemáte oprávnění aktualizovat tuto hru' });
        }

        // Aktualizujte hru
        game.Jmeno = nadpis;
        game.Popis = detail;
        game.Cena = cena;
        game.Kategorie = category;
        game.Obrazek = obrazek;
        
        await game.save();

        res.status(200).redirect(`/detail/${gameId}`);
    } catch (error) {
        console.error('Chyba při aktualizaci hry:', error);
        res.status(500).json({ error: 'Nastala chyba při aktualizaci hry' });
    }
}

exports.deleteGame = async (req, res) => {
    const gameId = req.params.id;
    const userId = req.session.userId; // Získání ID přihlášeného uživatele

    try {
        // Najděte záznam ve spojovací tabulce VyvojarHra
        const vyvojarHra = await model.VyvojarHra.findOne({ where: { UzivatelID: userId, HraID: gameId } });

        // Pokud záznam nebyl nalezen, vrátíme chybu 404
        if (!vyvojarHra) {
            return res.status(404).json({ error: 'Hra nebyla nalezena' });
        }

        // Smažte záznam ve spojovací tabulce VyvojarHra
        await model.VyvojarHra.destroy({ where: { UzivatelID: userId, HraID: gameId } });

        // Smažte záznam z tabulky Hra
       const game = await model.Hra.findByPk(gameId);
       if(game.Obrazek){
        const imagePath = path.join(__dirname, '../Public/images/uploads', game.Obrazek);
        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath); 
        }
       }
        await model.Hra.destroy({ where: { HraID: gameId } });

        res.status(200).redirect('/');
    } catch (error) {
        console.error('Chyba při mazání hry:', error);
        res.status(500).json({ error: 'Nastala chyba při mazání hry' });
    }
}



exports.buyGame = async (req, res) => {
    try {
        // Ověření, zda je uživatel přihlášený
        if (!req.session.userId) {
            return res.status(403).send('Nepovolený přístup');
        }

        // Získání identifikátoru hry z parametru cesty
        const gameId = req.params.id;

        // Získání aktuálního zůstatku uživatele
        const user = await model.Uzivatel.findByPk(req.session.userId);
        const currentBalance = user ? user.Zustatek : 0;
        console.log(currentBalance)
        // Získání ceny hry
        const game = await model.Hra.findByPk(gameId);
        const gamePrice = game ? game.Cena : 0;
        console.log(gamePrice)
        // Kontrola, zda má uživatel dostatek peněz na nákup hry
        if (currentBalance < gamePrice) {
            return res.status(400).send('Nemáte dostatek peněz na nákup této hry');
        }

        // Kontrola, zda uživatel již vlastní hru
        const existingOwnership = await model.SeznamHer.findOne({ where: { HraID: gameId, UzivatelID: req.session.userId } });
        if (existingOwnership) {
            return res.status(400).send('Tuto hru již vlastníte');
        }

        // Vytvoření záznamu v tabulce SeznamHer pro tuto hru a uživatele
        await model.SeznamHer.create({
            HraID: gameId,
            UzivatelID: req.session.userId,
            DatumKoupe: new Date(),
            Koupena: true
        });

        await game.increment('PocetKoupeni');
        // Aktualizace zůstatku uživatele
        await user.update({ Zustatek: currentBalance - gamePrice });

        // Pokud vše proběhlo úspěšně, přesměrujte uživatele zpět na knihovnu
        res.status(201).redirect('/library');
    } catch (error) {
        console.error('Chyba při nákupu hry:', error);
    }
}

exports.borrowGame = async (req, res) => {
    const gameId = req.params.id;

    try {
        // Zkontrolujeme, zda je hra již v knihovně uživatele
        const existingGame = await model.SeznamHer.findOne({
            where: { HraID: gameId, UzivatelID: req.session.userId }
        });

        // Pokud hra již existuje v knihovně uživatele, označíme ji jako půjčenou
        if (existingGame) {
            res.status(400).json({ error: 'Hra již existuje ve vaší knihovně' });
        } else {
            // Vypočteme datum vypršení půjčky (30 dní od aktuálního data)
            const currentDate = new Date();
            const expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + 30);

            // Přidáme hru do knihovny uživatele s nastavením data vypršení půjčky
            await model.SeznamHer.create({
                HraID: gameId,
                UzivatelID: req.session.userId,
                DatumKoupe: currentDate,
                DatumVyprchaniPujcky: expirationDate,
                Koupena: true
            });

            res.status(201).redirect('/library');
        }
    } catch (error) {
        console.error('Error borrowing game:', error);
        res.status(500).json({ error: 'Nastala chyba při půjčování hry' });
    }
}

exports.createReview = async (req, res) => {
    const userId = req.session.userId; // Získání ID přihlášeného uživatele
    const username = req.session.username
    const  gameId  = req.params.id;
    const { rating, comment } = req.body.review;
    console.log(req.body.review);
    try {
        // Vytvoření recenze v databázi
        await model.Recenze.create({
            HraID: gameId,
            UzivatelID: userId,
            Jmeno: username,
            Hodnoceni: rating,
            Popis: comment,
            Datum: new Date()
        });

        // Odpověď s potvrzením úspěšného vytvoření recenze
        res.status(201).redirect(`/detail/${gameId}`);
    } catch (error) {
        console.error('Chyba při vytváření recenze:', error);
        res.status(500).json({ error: 'Nastala chyba při vytváření recenze' });
    }
};


exports.deleteReview = async (req, res) => {
    const reviewId = req.params.id; // Získání ID recenze
    try {
        // Najděte recenzi podle ID
        const review = await model.Recenze.findByPk(reviewId);

        if (!review) {
            return res.status(404).json({ error: 'Recenze nebyla nalezena' });
        }

        // Kontrola oprávnění - zda je uživatel autorem recenze nebo má správcovská práva
        if (req.session.userId !== review.UzivatelID && !req.session.isAdmin) {
            return res.status(403).json({ error: 'Nemáte oprávnění smazat tuto recenzi' });
        }

        // Smažte recenzi
        await model.Recenze.destroy({ where: { RecenzeID: reviewId }});

        // Odpověď s potvrzením úspěšného smazání recenze
        res.status(200).redirect('/'); // Přesměrování na hlavní stránku nebo jinou vhodnou cílovou stránku
    } catch (error) {
        console.error('Chyba při mazání recenze:', error);
        res.status(500).json({ error: 'Nastala chyba při mazání recenze' });
    }
};


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
            Zustatek: 0,
            PrihlasovaciUdajeID: createdLogin.PrihlasovaciUdajeID
        });

        // SQL dotaz pro vytvoření uživatele v databázi s odpovídajícími oprávněními

        const createUserSQL = `
    DECLARE @LoginExists INT;
    SET @LoginExists = (SELECT COUNT(*) FROM sys.server_principals WHERE name = '${username}');

    IF @LoginExists = 0
    BEGIN
        CREATE LOGIN ${username} WITH PASSWORD = '${hashedPassword}';
        USE master;
        CREATE USER ${username} FOR LOGIN ${username};
        GRANT SELECT, INSERT, UPDATE, DELETE ON Hra TO ${username};
        GRANT SELECT, INSERT, UPDATE, DELETE ON Recenze TO ${username};
    END
    ELSE
    BEGIN
        PRINT 'Login ${username} already exists.';
    END;
`;

    // Spuštění SQL dotazu
    await model.sequelize.query(createUserSQL);


        // Odeslání výsledků jako odpověď
        const user = await model.Uzivatel.findOne({ where: { Jmeno: username } });
        req.session.userId = user.UzivatelID;
        req.session.username = username;
        req.session.password = hashedPassword;

        res.status(302).redirect('/');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Nepodařilo se zaregistrovat uživatele' });
    }
};



exports.loginUser = async (req, res) => {
    const { username, password } = req.body.user;

    if (username === admin && password === adminPassword) {
        req.session.userId = -1;
        req.session.username = username;
        req.session.isAdmin = true;
        return res.status(302).redirect('/');
    }
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
        logUserLogin(username);
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
        const referer = req.headers.referer || '/';
        res.status(200).redirect(referer);
    } catch (error) {
        console.error('Chyba při přepínání módu vývojáře:', error);
        res.status(500).json({ error: 'Nastala chyba při zpracování požadavku.' });
    }
}

exports.logoutUser = async (req, res) => {
    const isAdmin = req.session.isAdmin;
    if(!isAdmin){
        try {
            const userId = req.session.userId;
            const user = await model.Uzivatel.findByPk(userId);
    
            if (!user) {
                return res.status(404).json({ error: 'Uživatel nenalezen' });
            }
    
            // Změna hodnoty vyvojar
            user.Vyvojar = false;
            req.session.isVyvojar = user.Vyvojar;
            await user.save();
        } catch (error) {
            console.error('Chyba při přepínání módu vývojáře:', error);
            res.status(500).json({ error: 'Nastala chyba při zpracování požadavku.' });
        }
    }
    // delete session
    console.log("deleting session cookie");
    req.session.userId = null;
    if (isAdmin) {
        req.session.isAdmin = false;
    }
    req.session.save((err) => {
        if (err) next(err);
        req.session.regenerate((err) => {
            if (err) next(err);
            res.redirect("/");
        });
    });
};





