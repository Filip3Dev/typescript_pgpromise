const pgPromise = require('pg-promise');
const R         = require('ramda');
const request   = require('request-promise');
const { program } = require('commander');

function commaSeparated(value) {
  return value.split(',');
}

program
  .option('--user <string>')
  .option('--location <string>')
  .option('--language <string>', 'comma separated list', commaSeparated)

program.parse();

// Limit the amount of debugging of SQL expressions
const trimLogsSize : number = 200;

// Database interface
interface DBOptions
  { host      : string
  , database  : string
  , user?     : string
  , password? : string
  , port?     : number
  };

// Actual database options
const options : DBOptions = {
  user: 'test',
  password: '123test',
  host: 'localhost',
  database: 'lovelystay_test',
};

console.info('Connecting to the database:',`${options.user}@${options.host}:${options.port}/${options.database}`);

const pgpDefaultConfig = {
  promiseLib: require('bluebird'),
  query(query) {
    console.log('[SQL   ]', R.take(trimLogsSize,query.query));
  },
  error(err, e) {
    if (e.query) {
      console.error('[SQL   ERROR]', R.take(trimLogsSize,e.query),err);
    }
  }
};

interface GithubUsers {
  id : number
  login: string
  company: string
  avatar_url: string
  public_repos: number
  location: string
};

const pgp = pgPromise(pgpDefaultConfig);
const db = pgp(options);

const createDB = db.none('CREATE TABLE IF NOT EXISTS github_users (id BIGSERIAL, login TEXT UNIQUE, name TEXT, company TEXT, avatar_url TEXT, location TEXT, public_repos INT)');
const createLangDB = db.none('CREATE TABLE IF NOT EXISTS users_languages (id BIGSERIAL, language TEXT, user_id INT NOT NULL)');

const ops = program.opts();
const newUser = ops.user ? ops.user : 'gaearon';
const locationUser = ops.location ? ops.location : null;
const langsUser = ops.language !== undefined ? ops.language : null;

if (locationUser) listByLocation(locationUser);
if (langsUser && newUser) saveLanguagePreferences(langsUser, newUser);

createDB.then(() => request({
  uri: `https://api.github.com/users/${newUser}`,
  headers: { 'User-Agent': 'Request-Promise' },
  json: true
}))
.then((data: GithubUsers) => {
  return db.oneOrNone('INSERT INTO github_users (login, name, company, avatar_url, public_repos, location) VALUES ($[login], $[name], $[company], $[avatar_url], $[public_repos], $[location]) RETURNING id', data);
}).then(({ id }) => {
  console.log(`User ID => ${id}`);
})
.finally(() => process.exit(0));


function listByLocation(locationUser: string) {
  createDB.then(() => {
    return db.any(`SELECT login, name, company, avatar_url, public_repos, location FROM github_users WHERE location LIKE '%${locationUser}' `);
  }).then(data => {
    data.forEach(element => {
      console.info(`\n Filtered location => `, element);
    });
  })
  .finally(() => {
    process.exit(0);
  });
}

function saveLanguagePreferences(langsUser: Array<string>, newUser: string) {
  createLangDB.then(() => {
    return db.one(`SELECT id FROM github_users WHERE login = $1`, newUser);
  })
  .then(({ id }) => {
    let promises = [];
    langsUser.forEach(element => {
      promises.push(db.oneOrNone(`INSERT INTO users_languages (language, user_id) VALUES ($1, $2) RETURNING id`, [element, id]));
    });
    return Promise.all(promises);
  })
  .finally(() => {
    process.exit(0);
  });
}