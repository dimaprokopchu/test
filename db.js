const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const Test = sequelize.define('Test', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    questions: {
        type: DataTypes.JSON,
        allowNull: false
    }
});

const Result = sequelize.define('Result', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    testTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

sequelize.sync();

module.exports = {
    Test,
    Result
};

