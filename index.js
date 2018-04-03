/**
    1 – 80     : 2017 Mathcounts Chapter Countdown Problems
    ===========:===========================================
    81 - 105   : 1985 AJHSME Problems
    106        : 1986 AJHSME #s 3, 4*, 5*, 6-9
*/

const Discord = require("discord.js"), fs = require("fs"), request = require("request");
var express = require("express"), app = express();



const bot = new Discord.Client();

app.set("port", process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

// root directory initialization for template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get("port"), function() {
    console.log('Node app is running on port', app.get('port'));
});

app.get('/', function(request, response) {
    //response.render('pages/index');
    response.send("Success")
});

bot.login("NDIzOTM3ODQ5NDYxNTcxNTk0.DYxmag.Ryny9aAAiZfkvCoXPrUzrtitUiQ");
//JSON.parse(fs.readFileSync("../SSH.json"))

/* CD round! */
var players = JSON.parse(fs.readFileSync("./countdown/players.json")), configs = JSON.parse(fs.readFileSync("./countdown/configs.json")), chat, joined, gameNum;
var startedAt = 0, problemNum = 1, endAt, winner, startNum, buzzed = false;
var current = 0, answering, embedID, intervalID, timeouts = [];
var cTest, cNum = 1, problems = [], pJSON = JSON.parse(fs.readFileSync("./countdown/problems.json")), tJSON = JSON.parse(fs.readFileSync("./countdown/tests.json"));
for (let i = 0; i < pJSON.length; i++) {
    switch (typeof pJSON[i]) {
        case "string":
            cNum = 1;
            cTest = tJSON[pJSON[i]];
        break;
        case "number":
            cNum += pJSON[i];
        break;
        default:
            problems.push({
                test: cTest,
                number: cNum,
                answers: pJSON[i]
            });
            cNum++;
    }
}

function updateProblem (txt, params) {
    chat = chat.slice(chat.length - 11);
    endAt = startedAt;
    joined.sort((a, b) => players[b].score > players[a.score] ? 1 : 0);
    if (answering) {
        params.color = 0x00ffff;
        txt = '*' + answering + " is answering...*";
    }
    bot.channels.get('426369194020306954').fetchMessage(embedID).then(msg => {
        msg.edit({
            embed: Object.assign({
                title: "Problem #" + problemNum,
                description: (params.override ? '' :
                    ("You have " + Math.round(45 - ((new Date().getTime() - endAt) / 1000)) + " seconds remaining")) + '\n' + txt,
                fields: [
                    {
                        name: "Scoreboard",
                        value: joined.map(p => '<@' + p + ">(<:rating:426837451563335713>" + players[p].rating + '): ' + players[p].score + " points").join('\n')
                    },
                    {
                        name: "Chat",
                        value: chat.join('\n')
                    }
                ],
                footer: {
                    timestamp: new Date(),
                    text: "Problem ID: " + current + ", Game ID: " + gameNum
                }
            }, params)
        });
    });
}

function problem () {
    chat.push(":arrow_right: | **Problem #" + problemNum + " started!**");
    answering = '';
    timeouts.forEach(t => clearTimeout(t));
    clearInterval(intervalID);
    for (let p in players) {
        players[p].lastAnswered = problemNum - 1;
    }
    startedAt = new Date().getTime();
    current = Math.ceil(Math.random() * problems.length);
    if (winner) {
        joined.forEach(p => {
            players[p].ratingChange = Math.round(players[p].ratingChange);
            players[p].rating += players[p].ratingChange;
        });
        bot.channels.get('426369194020306954').send("Loading final results!").then(result => {
            embedID = result.id;
            updateProblem("Congratulations " + winner + "!\n**Rating changes:**\n" + joined.map(p => '<@' + p + ">: <:rating:426837451563335713>" + players[p].ratingChange).join('\n') + "\n*The scoreboard below reflects ratings after this game.*", {
                title: "Final results: Game #" + gameNum,
                color: 0xffff00,
                override: true
            });
        });
    } else {
        bot.channels.get('426369194020306954').send("Loading problem, please wait...", {
            files: [
                "./problems/" + current + ".png"
            ]
        }).then(result => {
            embedID = result.id;
            updateProblem('', {})
        });
        intervalID = setInterval(() => {
            updateProblem('', {});
        }, 5000);
        timeouts.push(setTimeout(() => {
            answering = '';
            updateProblem("**Time's up!** The answer was `" + problems[current - 1] + '`', {
                override: true,
                color: 0xff0000
            });
            problemNum++;
            problem();
        }, 45000));
    }
}
//

function dispTime (check) {
    var ints = [new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()];
    for (let i = 0; i < 3; i++) {
        if (ints[i] < 10) ints[i] = '0' + ints[i];
    }
    if (check && dispDate() + ".json" != check) ints[2] += ' ' + dispDate();
    return ints.join(':');
}

function dispDate () {
    return new Date().getFullYear() + '-' +
    (new Date().getMonth() + 1) + '-' +
    new Date().getDate();
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
    cd: [
        ["config", false, function (m, args) {
            if (!args[0]) {
                m.channel.send(
                    ":pencil: | **Instructions for creating a Countdown Configuration Set**\
                    \n1. Choose a six-character alphanumeric identifier as <arg1>. You can also edit an existing set by using its identifier.\
                    \n2. Select at least one test from the following list:\
                    \n" + Object.keys(tJSON).map(k => `\t\`${k}\`(${tJSON[k].full}): Difficulty ${tJSON[k].difficulty}/10, ${tJSON[k].numProblems} problems`).join('\n') + "\
                    \n*(Join the abbreviations of the tests together into a single string separated by a comma in <arg2>.)*\
                    \n3. Specify the number of correct answers needed to win and add the number at the end of <arg2>."
                )
            } else {
                m.channel.send("This doesn't work yet, sorry!")
            }

        }, "Creates a new configuration set <arg1> with data <arg2>. If the arguments are omitted, instructions will be given for hoe to create the set."],
        ["rules", false, function (m) {
            m.channel.send("Attached is a document containing rules for CD games.", {
                files: ["./CDrules.pdf"]
            });
        }, "Returns a document of the rules for CMSB Countdown games."],
        ["notification", false, function (m) {
            if (m.member.roles.get('426451155166429184')) m.member.removeRole('426451155166429184');
            else m.member.addRole('426451155166429184');
            consoles.append(m, "The Mathcounts Notification role has been " + (m.member.roles.get('426451155166429184') ? "removed from" : "added to") + " you.", 3);
        }, "Removes the Mathcounts Notification role from you if you have it, otherwise gives it to you."],
        ["open", false, function (m) {
            return consoles.append(m, "Sorry, this feature is currently under maintenance.", 0);
            if (m.channel.id != '426369194020306954') return m.channel.send("Please only do CD games in <#426369194020306954>.")
            if (startedAt) return consoles.append(m, "A CD game has already been started.", 0);
            m.guild.members.forEach(member => {
                if (!players[member.id]) players[member.id] = { rating: 1200 };
                Object.assign(players[member.id], {
                    score: 0,
                    lastAnswered: 0,
                    joined: false,
                    ratingChange: 0
                });
            });
            joined = [m.author.id];
            winner = '';
            gameNum = Math.ceil(Math.random() * 1000000);
            chat = [":beginner: | **Game started by " + m.author.toString() + "**"];
            players[m.author.id].joined = true;
            m.channel.send("<@&426451155166429184>: CD game opened!\
            \nUse `CMSB%cd%rules` to get a list of instructions and rules if you are not familiar with them.\
            \nIt is recommended that you copy `CMSB%cd%answer : _` into your clipboard before you begin for speed.\
            \n\
            \n*React with :inbox_tray: to join the game*\
            \n*The host(" + m.author.tag + ") can react with :white_check_mark: to start the game once there are multiple players*").then(msg => {
                msg.react('📥');
                msg.react('✅');
                msg.createReactionCollector((r, u) => {
                    if (r.emoji.name == '📥' && u.id != bot.user.id && !players[u.id].joined) {
                        players[u.id].joined = true;
                        msg.edit(msg.content.split('\n\n**')[0] + '\n\n**Players**\n```diff\n- ' + m.author.tag + ' (' + m.author.id + ')\n' + joined.map(p => '+ ' + players[p].rating + ': ' + bot.users.get(p).tag + ' (' + p + ')').join('\n') + '```');
                        joined.push(u.id);
                    }
                    if (r.emoji.name == '✅' && u.id == m.author.id) {
                        if (joined.length - 1 || m.author.id == '284799940843274240') {
                            problemNum = 1;
                            msg.delete();
                            m.channel.send("* Starting game in 3 seconds");
                            setTimeout(() => {
                                startedAt = new Date().getTime();
                                problem();
                            }, 3000);
                        } else consoles.append(m, "Cannot start game with only one player(for prevention of farming/problem memorization.)", 0);
                    }
                });
            });
        }, "Opens a CD game (<#426369194020306954> only)"],
        ["end", false, function (m) {
            timeouts.forEach(t => clearTimeout(t));
            clearInterval(intervalID);
            m.channel.send("CD game ended.");
            startedAt = 0;
        }, "Ends the current CD game."],
        ["answer", false, function (m, args) {
            if (!startedAt) return consoles.append(m, "No CD games are active currently. You can start one with `CMSB%cd%open`", 0);
            if (players[m.author.id].lastAnswered == problemNum) return chat.push(":no_entry: | " + m.author.toString() + ": You have already answered this question!**");
            if ('<@' + m.author.id + '>' != answering) return chat.push(":octagonal_sign: | " + m.author.toString() + ": Another player is answering!**");
            if (!players[m.author.id].joined) return;
            players[m.author.id].lastAnswered = problemNum;
            answering = '';
            if (problems[current - 1].split('|').map(a => a.split(' (')[0]).indexOf(args[0].toLowerCase()) >= 0) {
                players[m.author.id].score++;
                m.react('☑');
                chat.push("☑ | **Problem correctly answered by " + m.author.toString() + "!**")
                updateProblem("*Answer correct!*", {
                    color: 0x00ff00
                });
                players[m.author.id].ratingChange += 5;
                problemNum++;
                clearInterval(intervalID);
                if (players[m.author.id].score == 4) {
                    chat.push(":tada: | **" + m.author.toString() + " has won the game! Awarded <:rating:426837451563335713>" + Math.round(joined.length * Math.random() * 10 + 14) + ".**");
                    winner = m.author.toString();
                    players[m.author.id].ratingChange += joined.length * Math.random() * 10 + 14;
                    for (let p of joined) {
                        if (p != m.author.id) players[m.author.id].ratingChange -= Math.random() * 8 + 12;
                    }
                    problem();
                    cmd.cd[3][2](m);
                } else problem();
            } else {
                m.react('❌');
                chat.push('❌ | **' + m.author.toString() + " is incorrect.**")
                players[m.author.id].ratingChange -= Math.random() * 3 + 1;
                for (let p in players) {
                    if (players[p].lastAnswered < problemNum && players[p].joined) return;
                }
                chat.push(":exclamation: | **All players answered incorrectly, advancing to next question.**");
                problem();
            }
        }, "Checks your answer for the current CD problem."]
    ],
    run: [
        '', false, function (m, args) {
            if (m.author.id != 284799940843274240) return m.channel.reply("so that you don't break the bot, this command is reserved for developers.");
            var result;
            try {
                result = eval(args[0])
            } catch (e) {
                result = e;
            }
            m.channel.send("Result: ```js\n" + result + "\n```")
        }, "Runs <arg1>."
    ],
    schedule: [
        '', false, function (m) {
            consoles.append(m, "Connected to port", 2);
            consoles.append(m, "[HTTP] GET `http://http://www.hcpss.org/calendar/` (async)", 4);
            request
                .get("http://www.hcpss.org/calendar/")
                .on('response', response => {
                    consoles.append(m, "[HTTP] status code -> `" + response.statusCode + '`', 4);
                    consoles.append(m, "[HTTP] content-type -> `" + response.headers['content-type'] + '`', 2);
                })
                .on('error', err => {
                    consoles.append(m, "[HTTP] fatal -> `" + err + '`', 0);
                })
                .pipe(fs.createWriteStream("./schedule.html").on("close", () => {
                    consoles.append(m, "[npm] Fetch `./schedule.html`", 3);
                    m.channel.send('```html\n' + fs.readFileSync("./schedule.html").toString().split("<h1>HCPSS System Calendar</h1>")[1].split("<iframe")[0] + '```')
                }));
        }, "Retrieves the HCPSS master schedule."
    ],
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
        ["getEntry", false, function (m, args) {
            var entry = logs.findIndex(e => e.id == args[0]);
            consoles.append(m, "Collating logs...", 4);
            if (entry < 0) consoles.append(m, "Cannot find log entry with ID <arg1>.", 0);
            else {
                var entryCode = JSON.stringify(logs[entry], null, '\t');
                consoles.append(m, "Found entry at `idx/" + entry + '`.', 2);
                if (entryCode.length > 1988) consoles.append(m, "Entry length greater than API size threshold, splitting into " + Math.ceil(entryCode.length / 1988) + " messages.", 1);
                for (let c = 0; c < entryCode.length; c += 1988) {
                    m.channel.send("```JSON\n" + entryCode.substr(c, 1988) + "\n```");
                }
            }
        }, "Finds the log entry with ID <arg1> from the bot's logs, if existing."],
        /*
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
        */
        ["length", false, function (m) {
            fs.readdir("./logs", (err, files) => {
                m.channel.send("Entries logged: `" + logs.length + "`\
                \n" + __dirname + "/logs length: `" + files.length + "`\
                \nRAM allocated to logs: `" + (files.reduce((a, b) => a + fs.statSync("./logs/" + b).size, 0) / 1000000).toFixed(3) + "MB`");
            })
        }, "Provides information on the size of logs."],
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
                            consoles.append(m, '(' + (iter + 1) + '/' + args[0] + ") Active console waiting on finished stream, cannot delete [" + msg.id + '].', 1);
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
            if (!m.guild.members.get(id)) return consoles.append(m, "Cannot find member " + args[0] + ' in this server.', 0);
            consoles.append(m, "Indexing messages...", 2);
            var deleted = 0, iter = 0;
            m.channel.fetchMessages({ limit: 100 })
                .then(messages => {
                    consoles.append(m, "Deleting messages...", 4);
                    var delResult = m.channel.bulkDelete(messages.filter(msg => {
                        if (msg.author.id == id) {
                            if (consoles.list.find(l => l.id == msg.id)) consoles.append(m, '(' + (iter + 1) + '/' + 100 + ") Active console waiting on finished stream, cannot delete [" + msg.id + '].', 1);
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
            if (!args[1]) var toDelete = m.channel.fetchMessages({ limit: 2 });
            else var toDelete = m.channel.fetchMessage(args[1]);
            toDelete
                .then(result => {
                    if (!args[1]) result = result.last();
                    result.delete().then(() => {
                        setTimeout(() => {
                            reasons[m.id] = ["Reason: Automatic delete for CMSB/del/reason call"]
                            m.delete();
                        }, 5000);
                        reasons[result.id] = ["Moderator: " + m.author.tag + ' (' + m.author.id + ')', "Reason: " + args[0]];
                    })
                })
                .catch(err => {
                    consoles.append(m, args[1] ? "Error sending `GET` request to `<Channel>/" + args[1] + '`.' : err, 0);
                })
        }, "Deletes the previous message in the channel with a reason(<arg1>) that will be included in the logs(if existing)."]
    ],
    warn: [
        '', true, function (m, args) {
            if (args.length < 2) consoles.append(m, "This command requires two arguments!", 0);
            m.guild.channels.find("name", "member_logs").send({
                embed: {
                    color: 0xff8800,
                    title: "Warn issued",
                    description: args[0] + ':\n' + args[1],
                    footer: {
                        text: "Moderator: " + m.author.tag
                    }
                }
            });
        }, "Issues <arg1> a warning with reason <arg2>. Although warnings are not used for any administrative purposes within the bot currently, they may be in the future."
    ]
};

const dateStr = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
var logs = [], logMap = {}, reasons = {}, savedLogs = 0, edits = 0;
fs.readdir("./logs", function (err, files) {
    files.forEach(file => {
        if (!file.endsWith(".json")) return;
        JSON.parse(fs.readFileSync("./logs/" + file)).forEach(entry => {
            entry.date = file;
            logs.push(entry);
        });
    });
});

bot.on("ready", () => {
    //console.log(bot.guilds.array()[1].roles.array().map(r=>r.name + ' ' + r.id).join('\n'))
    bot.user.setPresence({game: {name: 'Use CMSB', type: 0}});
    console.log("@" + dispDate() + " > Started client");
    setInterval(() => {
        logMap = {};
        if (logs.length > savedLogs || edits) {
            for (let i = 0; i < logs.length; i++) {
                for (let j = 0; j < logs[i].updates.length; j++) {
                    if (logs[i].updates[j][0] == (logs[i].updates[j - 1] || [])[0]) logs[i].updates.splice(j, 1);
                }
                var date = logs[i].date + '';
                if (!logMap[date]) logMap[date] = [];
                delete logs[i].date;
                logMap[date].push(logs[i]);
                logs[i].date = date;
            }
            console.log("@" + dispDate() + " > Saved " + (logs.length - savedLogs) + " new log entries (" + edits + " edits).");
            for (let d in logMap) {
                if (!fs.existsSync("./logs/" + d)) console.log("@" + dispDate() + " | Created new log file for " + d + '.');
                fs.writeFile("./logs/" + d, JSON.stringify(logMap[d], null, '\t'), function (err) {
                    console.log("@" + dispDate() + " > Written " + (logMap[d] || { length : '?' }).length + " entries to " + d + '.');
                    savedLogs = logs.length;
                    edits = 0;
                });
            }
            fs.writeFile("./countdown/players.json", JSON.stringify(players, null, '\t'), function (err) {
                if (err) console.log(err);
                console.log("@" + dispDate() + " > Saved player data.");
            });
            reasons = {};
        }
    }, 1000);
})

bot.on("messageUpdate", (old, message) => {
    for (let i = 0; i < logs.length; i++) {
        if (logs[i].id == old.id) {
            logs[i].updates.push(["EDITED " + dispTime() +
            (dispDate() + ".json" == logs[i].date ? '': ' ' + dispDate()
            ), ... message.content.split('\n')]);
        }
    }
    edits++;
});

bot.on("messageDeleteBulk", function (messages) {
    messages.forEach(msg => {
        for (let i = 0; i < logs.length; i++) {
            if (logs[i].id == msg.id) {
                if (reasons[msg.id]) logs[i].reason = reasons[msg.id];
                logs[i].updates.push(["DELETED " + dispTime(logs[i].date)]);
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
            if (reasons[logs[i].id]) logs[i].updates[logs[i].updates.length - 1].push( ... reasons[logs[i].id]);
        }
    }
});

bot.on("guildBanAdd", function (guild, user) {
    guild.channels.find("name", "member_logs").send({
        embed: {
            color: 0xff0000,
            title: "Member Banned",
            description: user.toString() + " banned"
        }
    });
});

bot.on("guildBanRemove", function (guild, user) {
    guild.channels.find("name", "member_logs").send({
        embed: {
            color: 0xffff00,
            title: "Member unbanned",
            description: user.toString() + " unbanned"
        }
    });
});

bot.on("guildMemberAdd", function (member) {
    member.guild.channels.find("name", "member_logs").send({
        embed: {
            color: 0x00ff00,
            title: "Member joined",
            description: member.toString() + ", welcome to the server! Please refer to <#423932686613217300> for a list of guidelines."
        }
    });
});

bot.on("guildMemberRemove", function (member) {
    member.guild.channels.find("name", "member_logs").send({
        embed: {
            color: 0x000088,
            title: "Member left",
            description: member.toString() + " left the server."
        }
    });
});

bot.on("typingStart", function (channel, user) {
    if (channel.id == '426369194020306954' && startedAt && !answering) {
        if (players[user.id].lastAnswered < problemNum && players[user.id].joined) {
            answering = user.toString();
            updateProblem(user.toString() + " is answering...", {});
            timeouts.push(setTimeout(() => {
                if (players[user.id].lastAnswered < problemNum) {
                    answering = '';
                    players[user.id].lastAnswered = problemNum;
                    chat.push(":timer: | **Sorry " + user.toString() + ", your time is up. (" + Math.round(45 - ((new Date().getTime() - startedAt) / 1000)) + " seconds remaining)**")
                    color = 0;
                    players[user.id].ratingChange -= Math.random() * 4 + 1;
                }
            }, 5000));
        }
    }
});

var lastCall = 0;

bot.on("message", (message) => {
    if (message.guild.name=="Emojis: 11-60") return;
    logs.push(Object.assign({
        author: message.author.tag + " (" + message.author.id + ')',
        id: message.id,
        channel: message.channel.name ? ('#' + message.channel.name + ' (' + message.channel.id + ')') : "DM",
        updates: [["SENT " + dispTime(), ... message.content.split('\n')]],
        date: dispDate() + ".json"
    }, message.channel.name ? { server: (message.guild.name + ' (' + message.guild.id + ')')} : {}));
    if (message.channel.id == '426369194020306954' && startedAt && message.author.id != bot.user.id) {
        if (!message.content.startsWith("CMSB%cd%answer : ") || players[message.author.id].lastAnswered == problemNum || !players[message.author.id].joined) {
            chat.push('**' + message.author.username + '**: ' + message.content
                .replace('\n', ' ')
                .replace('*', '\\*')
                .replace('_', '\\_')
                .replace('~', '\\~')
                .replace('```', '\\`\\`\\`')
                .substr(0, 128));
            message.delete();
        }
    }
    if (!message.content.startsWith("CMSB") || new Date().getTime() - lastCall < 2000 || (message.channel.id == "426369194020306954" && !message.content.startsWith("CMSB%cd%") && startedAt)) return;
    if (message.content == "CMSB") {
        return message.channel.send({
            embed: {
                title: "Help",
                description: "By <@284799940843274240>\nThis bot is in active development, so there may be missing functionalities.",
                fields: [{
                    name: "Commands\n(put CMSB% in front of each, separate arguments with a colon surrounded by a space)",
                    value: Object.keys(cmd).map(k => 
                        `**${k}** \`(${typeof cmd[k][0] == "string" ? "command" : "branch"})\`\n${typeof cmd[k][0] == "string" ? cmd[k][3] : '`[' + cmd[k].length + " children]`"}`
                    ).join('\n\n')
                }]
            }
        });
    }
    message.content = message.content.substr(5);
    var splits = message.content.split('%');
    var a = splits[splits.length - 1].split(' : ').slice(1);
    splits[splits.length - 1] = splits[splits.length - 1].split(' : ')[0];
    var command = cmd[splits[0]];
    if (typeof command == "undefined") return consoles.append(message, "bash: " + splits + ": command not found", 0);
    if (typeof command[0] == "object" && splits.length == 1) {
        return message.channel.send("*Commands in branch* **" + splits + '**:\n' + command.map(a => '`' + a[0] + '`' + (a[1] ? '\\*' : '') + ': ' + a[3]).join('\n'));
    }
    if (splits.length == 2) {
        command = command.find(v => v[0] == splits[1]);
        if (typeof command == "undefined") return consoles.append(message, "bash: " + splits.join('/') + ": command not found", 0);
    }
    if (command[1] && ['284799940843274240', '302238344656715776', '133024315602894848'].indexOf(message.author.id) < 0) return consoles.append(message, "PermissionsError: Please run this command again as root/Administrator", 0)
    try {
        command[2](message, a);
    } catch (err) {
        consoles.append(message, err, 0);
    }
    lastCall = new Date().getTime();
});