/*
 * Copyright 2010-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//node.js deps
var gpio = require('gpio');
var Button = require('gpio-button');
//npm deps

//app deps
const deviceModule = require('..').device;
const cmdLineProcess = require('./lib/cmdline');

//begin module
var blueLedGpio, yellowLedGpio, intervalTimer;
var button6 = new Button('button6');
var button13 = new Button('button13');
var button19 = new Button('button19');
var button26 = new Button('button26');

button26.on('press', function () {
   console.log('press button26');
});

button26.on('hold', function () {
   console.log('button26 hold');
});

button26.on('release', function () {
   console.log('button26 release');
});

button19.on('press', function () {
   console.log('press button19');
   yellowLedGpio.set();
   setTimeout(function() { blueLedGpio.reset(); }, 2000);
});

button19.on('hold', function () {
   yellowLedGpio.set();
   console.log('button19 hold');
});

button19.on('release', function () {
   yellowLedGpio.set(0);
   console.log('button19 release');
});

button13.on('press', function () {
   console.log('press button13');
   blueLedGpio.set();
   setTimeout(function() { blueLedGpio.reset(); }, 2000);
});

button13.on('hold', function () {
   blueLedGpio.set();
   console.log('button13 hold');
});

button13.on('release', function () {
   blueLedGpio.set(0);
   console.log('button13 release');
});

button6.on('press', function () {
   console.log('press');
   blueLedGpio.set();
   setTimeout(function() { blueLedGpio.reset(); }, 2000);
});

button6.on('hold', function () {
   blueLedGpio.set();
   console.log('6 hold');
});

button6.on('release', function () {
   blueLedGpio.set(0);
   console.log('release');
});

blueLedGpio = gpio.export(23, {
   ready: function() {
      console.log("Blue LED Ready");
      intervalTimer = setInterval(function() {
      }, 2000);
   }
});

yellowLedGpio = gpio.export(24, {
   ready: function() {
      console.log("Yellow LED Ready");
      yellowLedGpio.on("change", function (val) {
         console.log(val);
      });

   }
});

// // Lets assume a different LED is hooked up to pin 4, the following code
// // will make that LED blink inversely with LED from pin 22
// gpio24 = gpio.export(23, {
//    ready: function() {
//       // bind to blueLedGpio's change event
//       blueLedGpio.on("change", function(val) {
//          gpio24.set(1 - val); // set gpio24 to the opposite value
//       });
//    }
// });

// // reset the headers and unexport after 10 seconds
// setTimeout(function() {
//    clearInterval(intervalTimer);          // stops the voltage cycling
//    blueLedGpio.removeAllListeners('change');   // unbinds change event
//    blueLedGpio.reset();                        // sets header to low
//    blueLedGpio.unexport();                     // unexport the header
//
//    gpio24.reset();
//    gpio24.unexport(function() {
//       // unexport takes a callback which gets fired as soon as unexporting is done
//       process.exit(); // exits your node program
//    });
// }, 10000);


function processTest(args) {
   //
   // The device module exports an MQTT instance, which will attempt
   // to connect to the AWS IoT endpoint configured in the arguments.
   // Once connected, it will emit events which our application can
   // handle.
   //
   const device = deviceModule({
      keyPath: args.privateKey,
      certPath: args.clientCert,
      caPath: args.caCert,
      clientId: args.clientId,
      region: args.region,
      baseReconnectTimeMs: args.baseReconnectTimeMs,
      keepalive: args.keepAlive,
      protocol: args.Protocol,
      port: args.Port,
      host: args.Host,
      debug: args.Debug
   });

   var timeout;
   var count = 0;
   const minimumDelay = 250;

   if (args.testMode === 1) {
      device.subscribe('topic_1');
   } else {
      device.subscribe('topic_2');
   }
   device.subscribe('led');
   if ((Math.max(args.delay, minimumDelay)) !== args.delay) {
      console.log('substituting ' + minimumDelay + 'ms delay for ' + args.delay + 'ms...');
   }
   timeout = setInterval(function() {
      count++;

      if (args.testMode === 1) {
         device.publish('topic_2', JSON.stringify({
            mode1Process: count
         }));
      } else {
         device.publish('topic_1', JSON.stringify({
            mode2Process: count
         }));
      }
   }, Math.max(args.delay, minimumDelay)); // clip to minimum

   //
   // Do a simple publish/subscribe demo based on the test-mode passed
   // in the command line arguments.  If test-mode is 1, subscribe to
   // 'topic_1' and publish to 'topic_2'; otherwise vice versa.  Publish
   // a message every four seconds.
   //
   device
      .on('connect', function() {
         console.log('connected');
      });
   device
      .on('close', function() {
         console.log('close');
      });
   device
      .on('reconnect', function() {
         console.log('reconnect');
      });
   device
      .on('offline', function() {
         console.log('offline');
      });
   device
      .on('error', function(error) {
         console.log('error', error);
      });
   device
      .on('message', function(topic, payload) {

         if(topic == "led") {
            console.log("led");
            if(payload!=null) {
               var jsonPayload = JSON.parse(payload.toString());
               if(jsonPayload.color == "yellow") {
                  yellowLedGpio.set();
                  setTimeout(function() { yellowLedGpio.reset(); }, 2000);
               }
               if(jsonPayload.color == "blue") {
                  blueLedGpio.set();
                  setTimeout(function() { blueLedGpio.reset(); }, 2000);
               }

            }
         }
         console.log('message', topic, payload.toString());
      });
}

module.exports = cmdLineProcess;

if (require.main === module) {
   cmdLineProcess('connect to the AWS IoT service and publish/subscribe to topics using MQTT, test modes 1-2',
      process.argv.slice(2), processTest);
}