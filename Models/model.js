const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.session.userId) {
    if(req.session.isAdmin){
      sequelize = new Sequelize('databaze', "sa", "heslo123", {
        dialect: 'mssql',
        host: 'localhost',
        port: 1433,
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
            }
        }
    });
    }
      // Přihlášený uživatel
      const { username, password } = req.user;
      sequelize = new Sequelize('databaze', username, password, {
          dialect: 'mssql',
          host: 'localhost',
          port: 1433,
          dialectOptions: {
              options: {
                  encrypt: false,
                  trustServerCertificate: true,
              }
          }
      });
  } else {
      // Host
      sequelize = new Sequelize('databaze', 'host', 'Heslo123', {
          dialect: 'mssql',
          host: 'localhost',
          port: 1433,
          dialectOptions: {
              options: {
                  encrypt: false,
                  trustServerCertificate: true,
              }
          }
      });
  }
  next();
});
const sequelize = new Sequelize('master', 'sa', 'heslo123', {
  dialect: 'mssql',
  host: 'localhost',
  port: 1433, // default MS SQL Server port
  dialectOptions: {
    options: {
      encrypt: false, // pokud nebudeš šifrovat spojení
      trustServerCertificate: true, // pokud používáš self-signed certificate
    }
  }
});

// Definice modelu pro tabulku PrihlasovaciUdaje
const PrihlasovaciUdaje = sequelize.define('PrihlasovaciUdaje', {
  Jmeno: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  Heslo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  PrihlasovaciUdajeID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  tableName: 'PrihlasovaciUdaje', // Nastavení názvu existující tabulky
  timestamps: false // Pokud nechcete Sequelize automaticky spravovat timestampy
});

// Definice modelu pro tabulku Uzivatel
const Uzivatel = sequelize.define('Uzivatel', {
  Zustatek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  Jmeno: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  Mail: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  Vyvojar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  UzivatelID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  DatumVzniku: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  RecenzeID: {
    type: DataTypes.INTEGER,
    allowNull: true // pokud může být null
  },
  PrihlasovaciUdajeID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PrihlasovaciUdaje',
      key: 'PrihlasovaciUdajeID'
    }
  }
}, {
  tableName: 'Uzivatel', // Nastavení názvu existující tabulky
  timestamps: false // Pokud nechcete Sequelize automaticky spravovat timestampy
});
const Hra = sequelize.define('Hra', {
    Jmeno: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    Popis: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    Cena: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    PocetKoupeni: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    HraID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    DatumVzniku: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Kategorie: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    Obrazek: {
      type: DataTypes.STRING(100),
      allowNull: true,
    }
    /*KategorieID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Kategorie',
        key: 'KategorieID'
      }
    }*/
  }, {
    tableName: 'Hra',
    timestamps: false,
    indexes: [
      {
          unique: false, 
          fields: ['Jmeno'] 
      }
  ]
  });
  
  /*// Definice modelu pro tabulku Kategorie
  const Kategorie = sequelize.define('Kategorie', {
    Jmeno: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Popis: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    KategorieID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    }
  }, {
    tableName: 'Kategorie',
    timestamps: false
  });*/
  
  // Definice modelu pro tabulku Recenze
  const Recenze = sequelize.define('Recenze', {
    Jmeno: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Popis: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    Hodnoceni: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    RecenzeID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    UzivatelID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Uzivatel',
        key: 'UzivatelID'
      }
    },
    HraID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Hra',
        key: 'HraID'
      }
    }
  }, {
    tableName: 'Recenze',
    timestamps: false
  });
  
  // Definice modelu pro tabulku SeznamHer
  const SeznamHer = sequelize.define('SeznamHer', {
    SeznamHerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    HraID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Hra',
        key: 'HraID'
      }
    },
    UzivatelID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Uzivatel',
        key: 'UzivatelID'
      }
    },
    DatumKoupe: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    DatumVyprchaniPujcky: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Koupena: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'SeznamHer',
    timestamps: false
  });

  const VyvojarHra = sequelize.define('VyvojarHra', {
    UzivatelID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Uzivatel',
        key: 'UzivatelID'
      }
    },
    HraID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Hra',
        key: 'HraID'
      }
    }
  }, {
    tableName: 'VyvojarHra',
    timestamps: false
  });

  const Logins = sequelize.define('Logins', {
    // definice sloupců
    UserName: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    LoginTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    // další sloupce podle potřeby
  }, {
    tableName: 'Logins', // Nastavení názvu tabulky
    timestamps: false // Pokud nechcete Sequelize automaticky spravovat timestampy
  });

 

// Vytvoření vztahu mezi tabulkami
// vztah mezi tabulkami Uzivatel a prihlasovaciUdaje
Uzivatel.belongsTo(PrihlasovaciUdaje, { foreignKey: 'PrihlasovaciUdajeID' });
// Vztah mezi tabulkami Hra a Kategorie
//Hra.belongsTo(Kategorie, { foreignKey: 'KategorieID' });
// Vztah mezi tabulkami Uzivatel a Recenze
Uzivatel.hasMany(Recenze, { foreignKey: 'UzivatelID' });

// Vztah mezi tabulkami Hra a Recenze
Hra.hasMany(Recenze, { foreignKey: 'HraID' });

// Vztah mezi tabulkami SeznamHer a Uzivatel
SeznamHer.belongsTo(Uzivatel, { foreignKey: 'UzivatelID' });
SeznamHer.belongsTo(Hra, { foreignKey: 'HraID' });
// Tabulka VyvojarHra
Uzivatel.belongsToMany(Hra, { through: 'VyvojarHra', foreignKey: 'UzivatelID' });
Hra.belongsToMany(Uzivatel, { through: 'VyvojarHra', foreignKey: 'HraID' });

// Synchronizace definovaných modelů s databází
sequelize.sync()
  .then(() => {
    console.log('Models synced successfully');
  })
  .catch(err => {
    console.error('Error syncing models:', err);
  });

module.exports = { PrihlasovaciUdaje, Uzivatel, Hra, Recenze, SeznamHer, VyvojarHra, Logins, sequelize };