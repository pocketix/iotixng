import {
  serializedToReadableCapabilityAndVariablesReplacer,
  readableToSerializedCapabilityAndVariablesReplacer,
} from './capabilityAndVariablesReplacers';
import { createVariablesFromDevice } from './createVariablesFromDevice';

// Regression test for "same whole-JSON substring-replace defect as
// iotix-react's copy" (a plain `.replaceAll(id, name)`
// over the whole serialized program has no boundary anchoring, so an
// id/label that's a string-prefix of another id/label gets partially
// replaced too).
describe('capabilityAndVariablesReplacers boundary anchoring', () => {
  it('does not let a shorter capabilityId corrupt a longer one that contains it as a prefix', () => {
    const program: any = { block: [{ name: '5451', params: [] }] };
    const capabilities: any = [
      { capabilityId: '54', name: 'ShortDevice', component: 'cmd' },
      { capabilityId: '5451', name: 'LongDevice', component: 'cmd' },
    ];

    const result = serializedToReadableCapabilityAndVariablesReplacer(program, capabilities, []);

    expect(result.block[0].name).toEqual('LongDevice');
  });

  it('round-trips a program through readable and back to serialized form', () => {
    const program: any = { block: [{ name: '5451', params: [] }] };
    const capabilities: any = [
      { capabilityId: '54', name: 'ShortDevice', component: 'cmd' },
      { capabilityId: '5451', name: 'LongDevice', component: 'cmd' },
    ];

    const readable = serializedToReadableCapabilityAndVariablesReplacer(program, capabilities, []);
    const backToSerialized = readableToSerializedCapabilityAndVariablesReplacer(readable, capabilities, []);

    expect(backToSerialized).toEqual(program);
  });
});

// Regression test for "capability names are sanitized but variable labels
// are not" (createCapabilitiesFromDeviceAndCapabilityTemplate.ts
// strips whitespace/operators/dots from device.deviceName, but
// createVariablesFromDevice.ts didn't - a variable label containing a
// space embeds an invalid token into condition strings once its label is
// substituted in, now that checkExpression() actually validates syntax).
describe('createVariablesFromDevice label sanitization', () => {
  it('strips whitespace and operator characters from the device name in the label', () => {
    const device: any = {
      deviceUid: '5451',
      deviceName: 'Living Room Lamp',
      parameterValues: [{ type: { name: 'brightness', label: 'Brightness' } }],
    };

    const variables = createVariablesFromDevice(device);

    expect(variables).toEqual([
      { id: '5451.brightness', label: 'LivingRoomLamp.Brightness' },
    ]);
  });
});
