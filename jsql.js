var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var jsql;
(function (jsql) {
    var _JSQL_connectionOptions;
    let mysql = require('mysql');
    // a convenience wrapper around the mysql npm library
    // last updated: 20/02/2022
    class JSQL {
        constructor(connectionOptions) {
            _JSQL_connectionOptions.set(this, void 0);
            // this is a pool-specific option, should be abstracted out to the external connectionOptions once it is confirmed pools are the best method
            connectionOptions.connectionLimit = 10;
            __classPrivateFieldSet(this, _JSQL_connectionOptions, connectionOptions, "f");
            this.pool = mysql.createPool(__classPrivateFieldGet(this, _JSQL_connectionOptions, "f"));
        }
        query(queryString) {
            // note that it is recommended to use this.pool.getConnection() when performing a transaction with multiple queries:
            // https://stackoverflow.com/questions/18496540/node-js-mysql-connection-pooling/18496936
            // https://www.npmjs.com/package/mysql
            return new Promise((resolve, reject) => {
                this.pool.query(queryString, (err, result) => {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        }
        // this is useful for if you have a more complex query that perhaps involves JOINs
        // the valuesObject acts like the insertInto values object, in that the keys align with columns
        // note that because this appends to the end of the query string, it will also add the semicolon for you
        // it could be upgraded by removing a semicolon at the end if it was provided, before appending
        advancedQuery(queryString, valuesObject) {
            // note that it is recommended to use this.pool.getConnection() when performing a transaction with multiple queries:
            // https://stackoverflow.com/questions/18496540/node-js-mysql-connection-pooling/18496936
            // https://www.npmjs.com/package/mysql
            return new Promise((resolve, reject) => {
                // we need to construct the condition segment of the queryString.
                // you're not sure why but it doesn't work when you provide an object (it does for the insertInto method!), 
                // so we need to process the object so that it is an array
                let valuesArray = [];
                let i = 0;
                for (const [key, value] of Object.entries(valuesObject)) {
                    if (i == 0) {
                        // HAVING is preferred over WHERE in this context because 
                        // it can refer to aliases, and aggregated columns after grouping
                        queryString += " HAVING ";
                    }
                    else {
                        queryString += " AND ";
                    }
                    queryString += ` ?? = ? `;
                    valuesArray.push(key);
                    valuesArray.push(value);
                    i++;
                }
                this.pool.query(queryString, valuesArray, (err, result) => {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        }
        insertInto(tableName, valuesObject) {
            return new Promise(async (resolve, reject) => {
                // should update this so that tableName is also escaped using the ? method
                this.pool.query(`INSERT INTO ${tableName} SET ?`, valuesObject, function (err, result) {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        }
        update(tableName, valuesObject, conditionString) {
            return new Promise(async (resolve, reject) => {
                // should update this so that tableName is also escaped using the ? method
                this.pool.query(`UPDATE ${tableName} SET ? WHERE ${conditionString}`, [valuesObject], function (err, result) {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        }
        // this is just a rough first pass, unfortunately there is not a nice way to do this in the way you'd like 
        // like there is for insertInto providing an object of values to update
        select(tableName, conditionObject = false, arrayOfColumnsToReturn) {
            return new Promise(async (resolve, reject) => {
                if (conditionObject == false) {
                    console.log("return everything");
                    this.pool.query(`SELECT * FROM ??`, [tableName], function (err, result) {
                        if (err) {
                            console.log(err.stack);
                            return reject(err);
                        }
                        resolve(result);
                    });
                }
                else {
                    this.pool.query(`SELECT * FROM ?? WHERE ?? = ?`, [tableName, Object.keys(conditionObject)[0], Object.values(conditionObject)[0]], function (err, result) {
                        if (err) {
                            console.log(err.stack);
                            return reject(err);
                        }
                        resolve(result);
                    });
                }
            });
        }
    }
    _JSQL_connectionOptions = new WeakMap();
    module.exports = { JSQL };
})(jsql || (jsql = {}));
