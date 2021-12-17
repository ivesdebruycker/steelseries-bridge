const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const port = 23000;

const ssConfig = JSON.parse(
  fs.readFileSync(
    `${process.env.ProgramData}/SteelSeries/SteelSeries Engine 3/coreProps.json`,
    { encoding: 'utf8' }
  )
);
console.log(`Connecting to ${ssConfig.address}`);

const eventEndpoint = `http://${ssConfig.address}/game_event`;
const heartbeatEndpoint = `http://${ssConfig.address}/game_heartbeat`;
const metadataEndpoint = `http://${ssConfig.address}/game_metadata`;
const bindEventEndpoints = `http://${ssConfig.address}/bind_game_event`;

const VOLUME_EVENT = 'VOLUME';
const SONG_EVENT = 'SONG';
const GAME_NAME = 'NODE_BRIDGE';

function doHearbeat() {
  TIMER = TIMER - 1;

  axios
    .post(heartbeatEndpoint, {
      game: GAME_NAME,
    })
    .catch(err => {
      console.log(err);
    })
    .then(console.log);

  if (TIMER > 0) {
    setTimeout(function () {
      doHearbeat();
    }, 10000);
  }
}

let TIMER = 10;
function resetHeartbeatTimer() {
  TIMER = 10;
  doHearbeat();
}

axios.post(bindEventEndpoints, {
  game: GAME_NAME,
  event: VOLUME_EVENT,
  min_value: 0,
  max_value: 100,
  handlers: [
    {
      'device-type': 'screened',
      zone: 'one',
      mode: 'screen',
      datas: [
        {
          'icon-id': 15,
          lines: [
            {
              'has-text': true,
              prefix: 'progress ',
              suffix: '%',
            },
            {
              'has-progress-bar': true,
            },
          ],
        },
      ],
    },
  ],
});

axios.post(bindEventEndpoints, {
  game: GAME_NAME,
  event: SONG_EVENT,
  handlers: [
    {
      'device-type': 'screened',
      zone: 'one',
      mode: 'screen',
      datas: [
        {
          'icon-id': 23,
          lines: [
            {
              'has-text': true,
              'context-frame-key': 'artist',
            },
            {
              'has-text': true,
              'context-frame-key': 'song',
            },
          ],
        },
      ],
    },
  ],
  data_fields: [
    {
      'context-frame-key': 'artist',
      label: 'Artist',
    },
    {
      'context-frame-key': 'song',
      label: 'Song',
    },
  ],
});

app.get('/set-current-song', ({ query }, res) => {
  console.log(query);
  const song = `${query.artist} - ${query.title}`;

  axios
    .post(eventEndpoint, {
      game: 'NODE_BRIDGE',
      event: SONG_EVENT,
      data: {
        value: song + new Date().getTime(),
        frame: {
          song: query.title,
          artist: query.artist,
        },
      },
    })
    .catch(err => {
      console.log(err);
    });
  //.then(console.log);

  resetHeartbeatTimer();

  res.send('OK');
});

app.get('/set-volume', ({ query }, res) => {
  axios
    .post(eventEndpoint, {
      game: 'NODE_BRIDGE',
      event: VOLUME_EVENT,
      data: {
        value: 25,
      },
    })
    .catch(err => {
      console.log(err);
    })
    .then(console.log);

  res.send('OK');
});

app.listen(port, () => {
  console.log(
    `NodeJS SteelSeries bridge listening at http://localhost:${port}`
  );
});
