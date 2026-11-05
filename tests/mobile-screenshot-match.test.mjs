import test from 'node:test';
import assert from 'node:assert/strict';
import { matchScreenshots, screenshotFromFilename } from '../src/pages/mobile-screenshot-match.js';
import { screenshotScenes } from '../src/pages/mobile-data.js';

const cases = [
  [
    {
      "scene": "query"
    },
    [
      "193749",
      "195830"
    ]
  ],
  [
    {
      "scene": "query",
      "filtering": true
    },
    [
      "193804"
    ]
  ],
  [
    {
      "scene": "query",
      "expanded": true
    },
    [
      "193912",
      "201837"
    ]
  ],
  [
    {
      "scene": "mine",
      "batch": true
    },
    [
      "200211"
    ]
  ],
  [
    {
      "scene": "query",
      "sheet": "more"
    },
    [
      "193942"
    ]
  ],
  [
    {
      "scene": "bank",
      "showBankForm": true
    },
    [
      "194919"
    ]
  ],
  [
    {
      "scene": "bank",
      "showBankForm": true,
      "bankSelected": true
    },
    [
      "195031"
    ]
  ],
  [
    {
      "scene": "permissions",
      "permissionForm": true
    },
    [
      "195559"
    ]
  ],
  [
    {
      "scene": "inviter",
      "newInviter": "张三"
    },
    [
      "195819"
    ]
  ],
  [
    {
      "scene": "inviter",
      "peoplePicker": true
    },
    [
      "195759",
      "195809"
    ]
  ],
  [
    {
      "scene": "register",
      "isRegistration": true,
      "step": 1,
      "contacts": 0
    },
    [
      "200459"
    ]
  ],
  [
    {
      "scene": "register",
      "isRegistration": true,
      "step": 1,
      "contacts": 2
    },
    [
      "200506"
    ]
  ],
  [
    {
      "scene": "register",
      "isRegistration": true,
      "step": 2,
      "registerBanks": 0
    },
    [
      "200556",
      "202934"
    ]
  ],
  [
    {
      "scene": "register",
      "isRegistration": true,
      "step": 2,
      "registerBanks": 1
    },
    [
      "200800"
    ]
  ],
  [
    {
      "scene": "register",
      "isRegistration": true,
      "step": 3
    },
    []
  ],
  [
    {
      "scene": "expiry",
      "isRegistration": true,
      "step": 0
    },
    [
      "202204"
    ]
  ],
  [
    {
      "scene": "portal",
      "portalEmail": true
    },
    [
      "203723"
    ]
  ],
  [
    {
      "scene": "portal",
      "passwordScreen": true
    },
    []
  ],
  [
    {
      "scene": "workspace-travel"
    },
    []
  ],
  [
    {
      "scene": "mine",
      "exportOpen": true
    },
    [
      "200321"
    ]
  ]
];
test('当前页面、步骤及弹层匹配原图', () => {
  for (const [state, expected] of cases) assert.deepEqual(matchScreenshots(state).map(shot => shot.time), expected, JSON.stringify(state));
});
test('47张原图文件名可唯一匹配', () => {
  assert.equal(screenshotScenes.length, 47);
  assert.equal(new Set(screenshotScenes.map(shot => shot.time)).size, 47);
  for (const shot of screenshotScenes) assert.equal(screenshotFromFilename(shot.filename)?.time, shot.time);
  assert.equal(screenshotFromFilename('unrelated.jpg'), null);
});
