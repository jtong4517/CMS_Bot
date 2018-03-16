const Discord = require("discord.js"), fs = require("fs");

const bot = new Discord.Client();

bot.login(JSON.parse(fs.readFileSync("../SSH.json")));

function dispTime () {
    var ints = [new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()];
    for (let i = 0; i < 3; i++) {
        if (ints[i] < 10) ints[i] = '0' + ints[i];
    }
    return ints.join(':');
}

function dispDate () {
    return new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
}

var consoles = {
    list: [],
    onStream: false,
    append: function (msg, val, type) {
        if (this.onStream) {
            return setTimeout(() => {
                this.append(msg, val, type);
            }, 100);
        }
        this.onStream = true;
        switch (type) {
            case 0:
                type = "<@&423931949426409482>";
            break;
            case 1:
                type = "<@&423932022155771908>";
            break;
            case 2:
                type = "<@&423932073854631936>";
            break;
            case 3:
                type = "<@&423932131388162049>";
            break;
            case 4:
                type = "<@&423932194508111872>"
        }
        var appendTo = this.list.find(c => c.caller == msg.id);
        if (appendTo) {
            appendTo.edit(appendTo.content + "\n`" + dispTime() + '` | ' + type + ' ' + val).then(() => {
                if (type == "<@&423209869508870146>") {
                    for (let c = 0; c < this.list.length; c++) {
                        if (this.list[c].id == appendTo.id) this.list.splice(c, 1);
                    }
                }
                appendTo.content += "\n`" + dispTime() + '` | ' + type + ' ' + val;
                this.onStream = false;
            });
        } else {
            msg.channel.send('`' + dispTime() + '` | ' + type + ' ' + val)
            .then(r => {
                r.caller = msg.id;
                this.list.push(r);
                this.onStream = false;
            });
        }
    }
};

var cmd = {
    rand: [
        ["int", false, function (m, args) {
            args = args.map(a => parseInt(a));
            if (isNaN(args[0]) || isNaN(args[1])) {
                return m.channel.send("The parameters must be numbers.");
            }
            m.channel.send(":game_die:: " + Math.floor(Math.random() * (args[1] - args[0] + 1) + args[0]));
        }, "Generates a random integer between <arg1> and <arg2>."],
        ["coin", false, function (m) {
            m.channel.send(":game_die:: " + ["`heads`", "`tails`"][Math.round(Math.random())]);
        }, "Generates either `heads` or `tails` randomly."]
    ],
    logs: [
        ["delete", true, function (m, args) {
            fs.unlink("./logs/" + args[0] + ".json", (err) => {
                if (err) consoles.append(m, err, 0);
                if (args[0] == dateStr) logs = [];
                consoles.append(m, "Logs from " + args[0] + " deleted.", 3);
            });
        }, "Deletes logs from <arg1>."],
        ["clear", true, function (m) {
            fs.readdir("./logs", (err, files) => {
                consoles.append(m, "Detected `./logs`, begin file deletion", 2);
                var iter = 0;
                logs = [];
                files.forEach(file => {
                    if (file != ".DS_Store") fs.unlink("./logs/" + file, () => {
                        consoles.append(m, "[npm] Deleted `" + file + "`", 4);
                        iter++;
                        if (iter == files.length) consoles.append(m, "Cleared " + files.length + " log(s).", 3);
                    });
                })
            });
        }, "Clears all logs ever cached."],
        ["retrieve", false, function (m, args) {
            if (fs.existsSync("./logs/" + args[0] + ".json")) {
                m.channel.send("Showing all logs from " + args[0] + ".", {
                    files: [
                        "./logs/" + args[0] + ".json"
                    ]
                })
            } else consoles.append(m, "No logs exist from `" + args[0] + "`.", 1);
        }, "Returns logs from <arg1>."]
    ],
    del: [
        ["num", true, function (m, args) {
            args[0] = parseInt(args[0]);
            if (isNaN(args[0]) || args[0] <= 0 || args[0] > 100) return consoles.append(m, "<arg1> must be a positive number less than or equal to 100.", 0);
            var aborted = 0, iter = 0;
            consoles.append(m, "Indexing messages...", 2);
            m.channel.fetchMessages({ limit: args })
                .then(messages => {
                    m.channel.bulkDelete(messages.filter(msg => {
                        iter++;
                        if (consoles.list.find(l => l.id == msg.id)) {
                            consoles.append(m, '(' + iter + '/' + args[0] + ") Active console waiting on finished stream, cannot delete [" + msg.id + '].', 1);
                            aborted++;
                        } else {
                            reasons[msg.id] = "Reason: Numerical bulk delete by " + m.author.tag + ' (' + m.author.id + ').';
                            return true
                        };
                    })).then(() => {
                        consoles.append(m, "[CLI] Deleted `" + (args[0] - aborted) + "` messages, " + aborted + " deletions aborted.", 3);
                    });
                })
                .catch(err => {
                    consoles.append(m, "[CLI] Parse error encountered (retry in 1 second)", 1);
                    setTimeout(() => {
                        consoles.append(m, "[CLI] FATAL: " + err, 0);
                        consoles.append(m, "[CLI] Deletion terminated -> EXIT CODE 1", 0);
                    }, Math.random() * 2000 + 500);
                });
        }, "Deletes the last <arg1> messages in the channel."],
        ["user", true, function (m, args) {
            var id = args[0].includes('!') ? args[0].substr(3, 18) : args[0].substr(2, 18);
            if (!m.guild.members.get(id)) return consoles.append(m, "Cannot find member " + args[0] + '.', 0);
            consoles.append(m, "Indexing messages...", 2);
            var deleted = 0, iter = 0;
            m.channel.fetchMessages({ limit: 100 })
                .then(messages => {
                    consoles.append(m, "Deleting messages...", 4);
                    var delResult = m.channel.bulkDelete(messages.filter(msg => {
                        if (msg.author.id == id) {
                            if (consoles.list.find(l => l.id == msg.id)) consoles.append(m, '(' + iter + '/' + args[0] + ") Active console waiting on finished stream, cannot delete [" + msg.id + '].', 1);
                            else {
                                deleted++;
                                reasons[msg.id] = "Reason: User bulk delete by " + m.author.tag + ' (' + m.author.id + ').';
                                return true;
                            }
                        }
                        iter++;
                    }))
                        .then(() => consoles.append(m, "[CLI] Deleted `" + deleted + "` messages.", 3))
                })
                .catch(err => {
                    consoles.append(m, "[CLI] Parse error encountered (retry in 1 second)", 1);
                    setTimeout(() => {
                        consoles.append(m, "[CLI] FATAL: " + err, 0);
                        consoles.append(m, "[CLI] Deletion aborted.", 0);
                    }, Math.random() * 2000 + 500);
                });
        }, "Deletes all messages from the user <arg1> from the last 100 messages in the channel."],
        ["reason", true, function (m, args) {
            if (!args[0]) return consoles.append(m, "Reason not provided.", 0);
            m.channel.fetchMessages({ limit: 2 })
                .then(messages => {
                    messages.last().delete().then(() => {
                        reasons[messages.last()] = ["Moderator: " + m.author.tag + ' (' + m.author.id + ')', "Reason: " + args[0]];
                    })
                });
        }, "Deletes the previous message in the channel with a reason(<arg1>) that will be included in the logs(if existing)."]
    ],
};

const dateStr = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
var logs = [], reasons = {}, savedLogs = 0, edits = 0;
if (!fs.existsSync("./logs/" + dispDate() + ".json")) {
    fs.writeFile("./logs/" + dispDate() + ".json", '[]', () => {
        console.log("@" + new Date() + " | Created new log file for " + dispDate() + '.');
    });
}
fs.readdir("./logs", function (err, files) {
    files.forEach(file => {
        if (!file.endsWith(".json")) return;
        JSON.parse(fs.readFileSync("./logs/" + file)).forEach(entry => {
            logs.push(Object.assign(entry, { date: file }));
        });
    });
});

bot.on("ready", () => {
    //console.log(bot.guilds.array()[0].roles.array().map(r=>r.name + ' ' + r.id).join('\n'))
    bot.user.setPresence({game: {name: 'Use CMSB', type: 0}});
    console.log("@" + new Date() + " | Started client");
    setInterval(() => {
        if (logs.length > savedLogs || edits) {
            var logMap = {};
            for (let i = 0; i < logs.length; i++) {
                for (let j = 0; j < logs[i].updates.length; j++) {
                    if (logs[i].updates[j][0] == (logs[i].updates[j - 1] || [])[0]) logs[i].updates.splice(j, 1);
                }
                var date = logs[i].date + '';
                if (!logMap[date]) logMap[date] = [];
                delete logs[i].date;
                logMap[date].push(logs[i]);
                logs[i].date = dispDate() + ".json";
            }
            console.log("@" + new Date() + " | Saved " + (logs.length - savedLogs) + " new log entries (" + edits + " edits).");
            for (let d in logMap) {
                fs.writeFile("./logs/" + d, JSON.stringify(logMap[d], null, '\t'), function(err) {
                    console.log("@" + new Date() + " | Written " + logMap[d].length + " entries to " + d + '.');
                    savedLogs = logs.length;
                    edits = 0;
                });
            }
            reasons = {};
        }
    }, 1000);
})

bot.on("messageUpdate", (old, message) => {
    for (let i = 0; i < logs.length; i++) {
        if (logs[i].id == old.id) logs[i].updates.push(["EDITED " + dispTime(), ... message.content.split('\n')]);
    }
    edits++;
});

bot.on("messageDeleteBulk", function (messages) {
    messages.forEach(msg => {
        for (let i = 0; i < logs.length; i++) {
            if (logs[i].id == msg.id) {
                if (reasons[msg.id]) logs[i].reason = reasons[msg.id];
                logs[i].updates.push(["DELETED " + dispTime()]);
                if (logs[i].reason) {
                    logs[i].updates[logs[i].updates.length - 1].push(logs[i].reason);
                    delete logs[i].reason;
                }
                edits++;
            }
        }
    });
});

bot.on("messageDelete", (message) => {
    for (let i = 0; i < logs.length; i++) {
        if (logs[i].id == message.id) {
            logs[i].updates.push(["DELETED " + dispTime()]);
            if (reasons[logs[i].id]) logs[i].updates[logs[i].updates.length - 1].push( ... logs[i]);
        }
    }
    edits++;
});

bot.on("message", (message) => {
    logs.push(Object.assign({
        author: message.author.tag + " (" + message.author.id + ')',
        id: message.id,
        channel: message.channel.name ? ('#' + message.channel.name + ' (' + message.channel.id + ')') : "DM",
        updates: [["SENT " + dispTime(), ... message.content.split('\n')]],
        date: dispDate() + ".json"
    }, message.channel.name ? { server: (message.guild.name + ' (' + message.guild.id + ')')} : {}));
    if (!message.content.startsWith("CMSB")) return;
    if (message.content == "CMSB") {
        return message.channel.send({
            embed: {
                title: "Help",
                description: "By <@284799940843274240>\nThis bot is in active development, so there may be missing functionalities.",
                fields: [{
                    name: "Commands (put CMSB/ in front of each, separate arguments with ` : `)",
                    value: "**help** `(command)`: Displays bot information.\n" +
                    "**logs** `(branch [3 children])`: Handles server logs.\n" +
                    "**rand** `(branch [2 children])`: Generates random values.\n" +
                    "**del** `(branch [3 children])`: Executes advanced message deletion.\n"
                }]
            }
        });
        
    }
    message.content = message.content.substr(5);
    var splits = message.content.split('/');
    var a = splits[splits.length - 1].split(' : ').slice(1);
    splits[splits.length - 1] = splits[splits.length - 1].split(' : ')[0];
    var command = cmd[splits[0]];
    if (typeof command == "undefined") return consoles.append(message, "bash: " + splits + ": command not found", 0);
    if (typeof command[0] == "object" && splits.length == 1) {
        return message.channel.send("*Commands in branch* **" + splits + '**:\n' + command.map(a => a[0] + (a[1] ? '\\*' : '') + ': ' + a[3]).join('\n'));
    }
    if (splits.length == 2) {
        command = command.find(v => v[0] == splits[1]);
        if (typeof command == "undefined") return consoles.append(message, "bash: " + splits.join('>') + ": command not found", 0);
    }
    if (command[1] && ['284799940843274240', '302238344656715776', '409804347073888266'].indexOf(message.author.id) < 0) return consoles.append(message, "PermissionsError: Please run this command again as root/Administrator", 0)
    try {
        command[2](message, a);
    } catch (err) {
        consoles.append(message, err, 0);
    }
});