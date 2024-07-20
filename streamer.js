const YTDlpWrap = require("yt-dlp-wrap").default;

// must install ytp-dlp on your system and instantiate node wrapper w/ binary location
const ytDlpWrap = new YTDlpWrap("/bin/yt-dlp");
const shell = require("shelljs");
require("dotenv").config();

// time delta function
function makeDates(
  days,
  start_month,
  end_month,
  start_day,
  end_day,
  start_year,
  end_year
) {
  if (end_day - days < 1) {
    days = days - start_day;
    if (start_month - 1 == 0) {
      start_month = 12;
      start_year -= 1;
    } else {
      start_month -= 1;
    }
    if (
      start_month == 4 ||
      start_month == 6 ||
      start_month == 9 ||
      start_month == 11
    ) {
      start_day = 30;
    } else if (start_month == 2 && start_year % 4 == 0) {
      start_day = 29;
    } else if (start_month == 2 && start_year % 4 != 0) {
      start_day = 28;
    } else {
      start_day = 31;
    }
    if (days >= 0) {
      return makeDates(
        days,
        start_month,
        end_month,
        start_day,
        start_day,
        start_year,
        end_year
      );
    }
  } else {
    start_day = (end_day - days).toString().padStart(2, "0");
    end_day = new Date().getDate().toString().padStart(2, "0");
    start_month = start_month.toString().padStart(2, "0");
    end_month = end_month.toString().padStart(2, "0");
    console.log(
      "Time Range: " +
        start_month +
        "/" +
        start_day +
        "/" +
        start_year +
        " to " +
        end_month +
        "/" +
        end_day +
        "/" +
        end_year
    );
    return [start_month, end_month, start_day, end_day, start_year, end_year];
  }
}

// clear downloads folder
shell.exec("rm -rf ./downloads");

// process environment variables
const AUTH = process.env.AUTH;
const CLIENT = process.env.CLIENT;
const USE_SUB_ALERT = process.env.USE_SUB_ALERT.toLowerCase() === "true";
const SUB_ALERT_CLIP_NUM = process.env.SUB_ALERT_CLIP_NUM;
const SUB_ALERT_FILE = process.env.SUB_ALERT_FILE;

// switch to true after everything is finished
let finished = false;

// start building FFMPEG command
let toWrite =
  USE_SUB_ALERT && SUB_ALERT_CLIP_NUM && SUB_ALERT_FILE
    ? "\nffmpeg -i ./downloads/input" +
      SUB_ALERT_CLIP_NUM +
      ".mp4 -i " +
      SUB_ALERT_FILE +
      ' -filter_complex "[1:v]chromakey=0x00D700:0.1:0.2[green];[0:v][green]overlay[outv]" -map "[outv]" -map "0:a" -c:v libx264 -c:a aac -strict experimental ./downloads/input' +
      SUB_ALERT_CLIP_NUM +
      "_sub.mp4\n" +
      "rm ./downloads/input" +
      SUB_ALERT_CLIP_NUM +
      ".mp4\n" +
      "mv ./downloads/input" +
      SUB_ALERT_CLIP_NUM +
      "_sub.mp4 ./downloads/input" +
      SUB_ALERT_CLIP_NUM +
      ".mp4\n" +
      "ffmpeg"
    : "ffmpeg";

// get streamer ID from username
async function getIdFromName(name, dates) {
  const response = await fetch(
    "https://api.twitch.tv/helix/users?login=" + name,
    {
      method: "GET",
      headers: {
        Authorization: AUTH,
        "Client-Id": CLIENT,
      },
    }
  );

  try {
    const body = await response.json();
    console.log(name + "'s broadcaster ID: " + body["data"][0]["id"]);
    getClipsFromId(body["data"][0]["id"], dates);
  } catch (err) {
    console.error("TWITCH API RESPONSE NOT OK. ERROR: " + err);
  }
}

// get top clips in time frame from broadcaster ID
async function getClipsFromId(
  id,
  [start_month, end_month, start_day, end_day, start_year, end_year]
) {
  const response = await fetch(
    "https://api.twitch.tv/helix/clips?broadcaster_id=" +
      id +
      "&started_at=" +
      start_year +
      "-" +
      start_month +
      "-" +
      start_day +
      "T00:00:00Z&ended_at=" +
      end_year +
      "-" +
      end_month +
      "-" +
      end_day +
      "T00:00:00Z",
    {
      method: "GET",
      headers: {
        Authorization: AUTH,
        "Client-Id": CLIENT,
      },
    }
  );

  if (response.ok) {
    const clips = await response.json();
    beginDownloading(clips);
  } else {
    console.error("TWITCH API RESPONSE NOT OK. ERROR: " + response.status);
  }
}

// download clips and keep build FFMPEG command
async function beginDownloading(input) {
  const vidName = Date.now();
  var cnt = 0;
  let dat = input["data"];
  for (let i = 0; i < dat.length; i++) {
    dl(dat[i]["url"], i + 1);
    toWrite += ` -i ./downloads/input${i + 1}.mp4`;
    cnt += 1;
  }
  console.log("Starting download...");
  toWrite += ' -filter_complex "';
  for (let i = 0; i < cnt; i++) {
    toWrite += `[${i}:v]scale=1920x1080[v${i}];`;
  }
  for (let i = 0; i < cnt; i++) {
    toWrite += `[v${i}][${i}:a]`;
  }
  toWrite +=
    " concat=n=" +
    cnt +
    ':v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -vsync 2 -strict experimental ./master/' +
    vidName +
    `.mp4\n\nrm -rf ./downloads`;
  finished = true;
}

// download a single clip
function dl(link, name) {
  let ytDlpEventEmitter = ytDlpWrap
    .exec([link, "-f", "best", "-o", "./downloads/input" + name + ".mp4"])
    .on("progress", (progress) =>
      console.log(
        progress.percent,
        progress.totalSize,
        progress.currentSpeed,
        progress.eta
      )
    )
    .on("ytDlpEvent", (eventType, eventData) =>
      console.log(eventType, eventData)
    )
    .on("error", (error) => console.error(error));

  console.log(`PID:${ytDlpEventEmitter.ytDlpProcess.pid}-${link}`);
}

// get user input
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(
  "Enter a broadcaster username and how many days back to search separated by a colon:\n",
  (name) => {
    const strmr = name.split(":")[0];
    const days = name.split(":")[1];
    dt = new Date();
    getIdFromName(
      strmr,
      makeDates(
        days,
        dt.getMonth() + 1,
        dt.getMonth() + 1,
        dt.getDate(),
        dt.getDate(),
        dt.getFullYear(),
        dt.getFullYear()
      )
    );
    readline.close();
  }
);

// execute FFMPEG command on exit
process.on("exit", () => {
  // only execute command if everything worked
  if (finished && toWrite != "ffmpeg") {
    shell.exec(toWrite);
  }
});
