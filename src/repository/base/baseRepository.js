const mysql = require('mysql');

class BaseRepository {
    async query(sql) {
        return new Promise((resolve, reject) => {
            try {
                sql = sql
                    .replace(/⁰/ig, '.o')
                    .replace(/'null'|'undefined'/ig, 'null')
                    .replace(/\s+/g, ' ').trim()
                    .replace(/ /g, '').trim();

                this.credentials['charset'] = 'utf8mb4';
    
                const connection = mysql.createConnection(this.credentials);
                
                connection.connect();

                const params = [
                    sql, 
                    async function (error, results) {
                        if (error) { 
                            reject({ error, sql });
                        } else {
                            resolve(results);
                        }
                        await new Promise(resolve => connection.end(() => resolve()));
                    }
                ];

                connection.query(...params);
                
            } catch(error) {
                //retorna informações para saber o tipo de erro
                reject({ error, sql });
            }
        });
    }
}

module.exports = BaseRepository;