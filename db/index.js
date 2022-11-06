const pg = require('pg')

const client  = new pg.Client('postgres://localhost:5432/ProjectOverview')

module.exports = { client }


// \l
// \c
// \d
// \dt
