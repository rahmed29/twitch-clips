const YTDlpWrap = require('yt-dlp-wrap').default
const ytDlpWrap = new YTDlpWrap('/bin/yt-dlp')
const fs = require('fs')
var shell = require("shelljs")
require('dotenv').config()

function pad(str)
{
    if((str + "").length < 2)
    {
        str = "0" + str;
    }
    return str;
}

let days
let start_month
let end_month
let start_day
let end_day
let start_year
let end_year

function makeDates(daysBack, monthS, monthE, dateS, dateE, yearS, yearE)
{
    days = daysBack
    start_month = monthS
    end_month = monthE
    start_day = dateS
    end_day = dateE
    start_year = yearS
    end_year = yearE
    if(end_day-days < 1)
    {
        days = days - start_day
        if(start_month - 1 == 0)
        {
            start_month = 12
            start_year -= 1
        }
        else
        {
            start_month -= 1
        }
        if(start_month == 4 || start_month == 6 || start_month == 9 ||start_month == 11)
        {
            start_day = 30
        }
        else if(start_month == 2 && start_year % 4 == 0)
        {
            start_day = 29
        }
        else if(start_month == 2 && start_year % 4 != 0)
        {
            start_day = 28
        }
        else
        {
            start_day = 31;
        }
        if(days >= 0)
        {
            makeDates(days, start_month, end_month, start_day, start_day, start_year, end_year)
        }
    }
    else
    {
        start_day = pad(end_day-days)
        end_day = pad(new Date().getDate())
        start_month = pad(start_month)
        end_month = pad(end_month)
        console.log("Time Range: " + start_month + "/" + start_day + "/" + start_year + " to " + end_month + "/" + end_day + "/" + end_year)
    }
}

async function whois(str) {
    try {
      const response = await fetch("https://api.twitch.tv/helix/users?login=" + str, {
        method: 'GET',
        headers: {
            'Authorization': process.env.AUTH,
            'Client-Id': process.env.CLIENT
        },
      });
  
      if (response.ok) {
        const body = await response.json();
        console.log(str + "'s broadcaster ID: " + body["data"][0]["id"])
        myFunc(body["data"][0]["id"])
      }
    } catch (err) {
      console.error("Error");
    }
}

async function myFunc(str) {
    try {  
      const response = await fetch("https://api.twitch.tv/helix/clips?broadcaster_id=" + str + "&started_at=" + start_year + "-" + start_month + "-"+ start_day + "T00:00:00Z&ended_at=" + end_year + "-" + end_month + "-" + end_day + "T00:00:00Z", {
        method: 'GET',
        headers: {
            'Authorization': process.env.AUTH,
            'Client-Id': process.env.CLIENT
        },
      });
  
      if (response.ok) {
        const body = await response.json();
        funcTwo(body, (err, output) => {
        });
      }
    } catch (err) {
      console.error("Error");
    }
}

let toWrite = "ffmpeg";

async function funcTwo(input, callback) {
    var cnt = 0;
    callback(null, input);
    let dat = input["data"];
    for(let i = 0;i < dat.length; i++)
    {
        download(dat[i]["url"], i + 1)
        toWrite = toWrite + " -i ./downloads/input" + (i+1) + ".mp4";
        cnt += 1;
    }
    console.log("Starting download...")
    toWrite = toWrite + ' -filter_complex "';
    for(let i = 0; i < cnt; i++)
    {
        toWrite = toWrite + "[" + i + ":v]scale=1920x1080[v" + i + "];"
    } 
    for(let i = 0; i < cnt; i++)
    {
        toWrite = toWrite + "[v" + i + "][" + i + ":a]"
    }
    toWrite = toWrite + ' concat=n=' + cnt + ':v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -vsync 2 -strict experimental ./master/' + Date.now() + '.mp4\n\nrm -rf ./downloads';
    fs.writeFileSync('./merge.sh', toWrite); 
}

function download(link, name){
let ytDlpEventEmitter = ytDlpWrap
    .exec([
        link,
        '-f',
        'best',
        '-o',
        "./downloads/input" + name  +".mp4",
    ])
    .on('progress', (progress) =>
        console.log(
            progress.percent,
            progress.totalSize,
            progress.currentSpeed,
            progress.eta
        )
    )
    .on('ytDlpEvent', (eventType, eventData) =>
        console.log(eventType, eventData)
    )
    .on('error', (error) => console.error(error))

console.log("PID: " + ytDlpEventEmitter.ytDlpProcess.pid + " - " + link);
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
  
readline.question('Enter a broadcaster username and how many days back to search separated by a colon:\n', name => {
    dt = new Date()
    let stmr = name.substring(0,name.indexOf(":"))
    let days = name.substring(name.indexOf(":")+1)
    makeDates(days, dt.getMonth()+1, dt.getMonth()+1, dt.getDate(), dt.getDate(), dt.getFullYear(), dt.getFullYear())
    whois(stmr)
    readline.close();
});

process.on('exit', () => {
    if(toWrite != "ffmpeg")
    {
        shell.exec("./merge.sh")
    }
  });