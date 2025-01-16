//import {Database} from "../js/mapsvg/Infrastructure/Database/Database.js";
const db = require("../js/mapsvg/Infrastructure/Server/Database.js");
//const object = require('../js/mapsvg/Object/CustomObject');

test("DB get()", () => {
    //    console.log(object);
    const callback = jest.fn();
    let dbInstance = new db.Database();
    return expect(dbInstance.get("/maps/4726")).rejects.toEqual(
        expect.objectContaining({ readyState: 4 })
    );
});
