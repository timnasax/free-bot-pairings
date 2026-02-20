module.exports = { 
    makeid: (num = 4) => {
        let res = "";
        let char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (let i = 0; i < num; i++) res += char.charAt(Math.floor(Math.random() * char.length));
        return res;
    } 
};
