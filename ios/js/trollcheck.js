const supportedVersions = [
  '14.0', '14.0 Beta 2', '14.1', '14.2', '14.3', '14.4', '14.5', '14.5.1', '14.6', '14.7', '14.7.1', '14.8', '14.8.1',
  '15.0', '15.0.1', '15.0.2', '15.1', '15.1.1', '15.2', '15.2.1', '15.3', '15.3.1', '15.4', '15.4.1', 
  '15.5', '15.5 Beta 4', '15.6', '15.6 Beta 1-4', '15.6.1', 
  '15.7', '15.7.1', '15.7.2', '15.7.3', '15.7.4', '15.7.5', '15.7.6', '15.7.7', '15.7.8', '15.7.9', 
  '15.8', '15.8.1', '15.8.2', '15.8.3', '15.8.4', '15.8.5', '15.8.6',
  '16.0', '16.0 Beta 1-5', '16.0.1', '16.0.2', '16.1', '16.1.1', '16.1.2', '16.2', '16.3', '16.4', '16.5', '16.6','16.6.1', '16.7 RC' ,'17.0 Beta 1-5','17.0'
];

const deviceList = [
  { model: 'iPhone 6s', architecture: 'arm64', minVersion: '9.0', maxVersion: '15.8.6' },
  { model: 'iPhone 6s Plus', architecture: 'arm64', minVersion: '9.0', maxVersion: '15.8.6' },
  { model: 'iPhone SE (1st generation)', architecture: 'arm64', minVersion: '9.3', maxVersion: '15.8.6' },
  { model: 'iPhone 7', architecture: 'arm64', minVersion: '10.0', maxVersion: '15.8.6' },
  { model: 'iPhone 7 Plus', architecture: 'arm64', minVersion: '10.0', maxVersion: '15.8.6' },
  { model: 'iPhone 8', architecture: 'arm64', minVersion: '11.0', maxVersion: '16.7.14' },
  { model: 'iPhone 8 Plus', architecture: 'arm64', minVersion: '11.0', maxVersion: '16.7.14' },
  { model: 'iPhone X', architecture: 'arm64e', minVersion: '12.0', maxVersion: '16.7.14' },
  { model: 'iPhone XR', architecture: 'arm64e', minVersion: '12.0', maxVersion: '18.7.5' },
  { model: 'iPhone XS', architecture: 'arm64e', minVersion: '12.0', maxVersion: '18.7.2' },
  { model: 'iPhone XS Max', architecture: 'arm64e', minVersion: '12.0', maxVersion: '18.7.2' },
  { model: 'iPhone 11', architecture: 'arm64e', minVersion: '13.0', maxVersion: '27.0' },
  { model: 'iPhone 11 Pro', architecture: 'arm64e', minVersion: '13.0', maxVersion: '27.0' },
  { model: 'iPhone 11 Pro Max', architecture: 'arm64e', minVersion: '13.0', maxVersion: '27.0' },
  { model: 'iPhone SE(2nd generation)', architecture: 'arm64e', minVersion: '13.4', maxVersion: '27.0' },
  { model: 'iPhone 12 mini', architecture: 'arm64e', minVersion: '14.1', maxVersion: '27.0' },
  { model: 'iPhone 12', architecture: 'arm64e', minVersion: '14.1', maxVersion: '27.0' },
  { model: 'iPhone 12 Pro', architecture: 'arm64e', minVersion: '14.1', maxVersion: '27.0' },
  { model: 'iPhone 12 Pro Max', architecture: 'arm64e', minVersion: '14.1', maxVersion: '27.0' },
  { model: 'iPhone 13 mini', architecture: 'arm64e', minVersion: '15.0', maxVersion: '27.0' },
  { model: 'iPhone 13', architecture: 'arm64e', minVersion: '15.0', maxVersion: '27.0' },
  { model: 'iPhone 13 Pro', architecture: 'arm64e', minVersion: '15.0', maxVersion: '27.0' },
  { model: 'iPhone 13 Pro Max', architecture: 'arm64e', minVersion: '15.0', maxVersion: '27.0' },
  { model: 'iPhone SE(3rd generation)', architecture: 'arm64e', minVersion: '15.4', maxVersion: '27.0' },
  { model: 'iPhone 14', architecture: 'arm64e', minVersion: '16.0', maxVersion: '27.0' },
  { model: 'iPhone 14 Plus', architecture: 'arm64e', minVersion: '16.0', maxVersion: '27.0' },
  { model: 'iPhone 14 Pro', architecture: 'arm64e', minVersion: '16.0', maxVersion: '27.0' },
  { model: 'iPhone 14 Pro Max', architecture: 'arm64e', minVersion: '16.0', maxVersion: '27.0' },
  { model: 'iPhone 15', architecture: 'arm64e', minVersion: '17.0', maxVersion: '27.0' },
  { model: 'iPhone 15 Plus', architecture: 'arm64e', minVersion: '17.0', maxVersion: '27 0' },
  { model: 'iPhone 15 Pro', architecture: 'arm64e', minVersion: '17.0', maxVersion: '27.0' },
  { model: 'iPhone 15 Pro Max', architecture: 'arm64e', minVersion: '17.0', maxVersion: '27 0' },
  { model: 'iPhone 16', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  { model: 'iPhone 16 Plus', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  { model: 'iPhone 16 Pro', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  { model: 'iPhone 16 Pro Max', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  { model: 'iPhone 16e', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  
  { model: 'iPhone 17', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPhone 17 Pro', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPhone 17 Pro Max', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPhone 17 Air', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPad Pro 13-inch (M5)', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPad Pro 11-inch (M5)', architecture: 'arm64e', minVersion: '26.0', maxVersion: '27.0' },
  { model: 'iPad Pro 13-inch (M4)', architecture: 'arm64e', minVersion: '17.5', maxVersion: '27.0' },
  { model: 'iPad Pro 11-inch (M4)', architecture: 'arm64e', minVersion: '17.5', maxVersion: '27.0' },
  { model: 'iPad Air 13-inch (M2)', architecture: 'arm64e', minVersion: '17.5', maxVersion: '27.0' },
  { model: 'iPad Air 11-inch (M2)', architecture: 'arm64e', minVersion: '17.5', maxVersion: '27.0' },
  { model: 'iPad mini (A17 Pro)', architecture: 'arm64e', minVersion: '18.0', maxVersion: '27.0' },
  { model: 'iPad Pro 12.9-inch (6th generation)', architecture: 'arm64e', minVersion: '16.1', maxVersion: '99.9' },
  { model: 'iPad Pro 11-inch (4th generation)', architecture: 'arm64e', minVersion: '16.1', maxVersion: '99.9' },
  { model: 'iPad Pro 12.9-inch (5th generation)', architecture: 'arm64e', minVersion: '14.5', maxVersion: '99.9' },
  { model: 'iPad Pro 11-inch (3rd generation)', architecture: 'arm64e', minVersion: '14.5', maxVersion: '99.9' },
  { model: 'iPad Pro 12.9-inch (4th generation)', architecture: 'arm64e', minVersion: '13.4', maxVersion: '99.9' },
  { model: 'iPad Pro 11-inch (2nd generation)', architecture: 'arm64e', minVersion: '13.4', maxVersion: '99.9' },
  { model: 'iPad Pro 12.9-inch (3rd generation)', architecture: 'arm64e', minVersion: '12.1', maxVersion: '99.9' },
  { model: 'iPad Pro 11-inch (1st generation)', architecture: 'arm64e', minVersion: '12.1', maxVersion: '99.9' },
  { model: 'iPad Air (5th generation)', architecture: 'arm64e', minVersion: '15.4', maxVersion: '99.9' },
  { model: 'iPad Air (4th generation)', architecture: 'arm64e', minVersion: '14.1', maxVersion: '99.9' },
  { model: 'iPad Air (3rd generation)', architecture: 'arm64e', minVersion: '12.2', maxVersion: '99.9' },
  { model: 'iPad mini (6th generation)', architecture: 'arm64e', minVersion: '15.0', maxVersion: '99.9' },
  { model: 'iPad mini (5th generation)', architecture: 'arm64e', minVersion: '12.2', maxVersion: '99.9' },
  { model: 'iPad (10th generation)', architecture: 'arm64e', minVersion: '16.1', maxVersion: '99.9' },
  { model: 'iPad (9th generation)', architecture: 'arm64e', minVersion: '15.0', maxVersion: '99.9' },
  { model: 'iPad (8th generation)', architecture: 'arm64e', minVersion: '14.0', maxVersion: '99.9' },
  { model: 'iPad (7th generation)', architecture: 'arm64', minVersion: '13.1', maxVersion: '17.7.5' },
  { model: 'iPad (6th generation)', architecture: 'arm64', minVersion: '11.3', maxVersion: '17.7.5' },
  { model: 'iPad (5th generation)', architecture: 'arm64', minVersion: '10.3', maxVersion: '16.7.14' },
  { model: 'iPad Pro 12.9-inch (2nd generation)', architecture: 'arm64', minVersion: '10.3.2', maxVersion: '17.7.5' },
  { model: 'iPad Pro 10.5-inch', architecture: 'arm64', minVersion: '10.3.2', maxVersion: '17.7.5' },
  { model: 'iPad Pro 9.7-inch', architecture: 'arm64', minVersion: '9.3', maxVersion: '16.7.14' },
  { model: 'iPad Pro 12.9-inch (1st generation)', architecture: 'arm64', minVersion: '9.1', maxVersion: '16.7.14' },
  { model: 'iPad mini 4', architecture: 'arm64', minVersion: '9.0', maxVersion: '15.8.6' },
  { model: 'iPad Air 2', architecture: 'arm64', minVersion: '8.1', maxVersion: '15.8.6' }
];
const iosVersions = [
  '14.0 Beta 2', '14.0', '14.1', '14.2', '14.3', '14.4', '14.4.1', '14.4.2', '14.5', '14.5.1', '14.6', '14.7', '14.7.1', '14.8', '14.8.1',
  '15.0', '15.0.1', '15.0.2', '15.1', '15.1.1', '15.2', '15.2.1', '15.3', '15.3.1', '15.4', '15.4.1', '15.5', '15.5 Beta 4', '15.6', '15.6 Beta 1-4', '15.6.1', '15.7', '15.7.1', '15.7.2', '15.7.3', '15.7.4', '15.7.5', '15.7.6', '15.7.7', '15.7.8', '15.7.9', '15.8', '15.8.1', '15.8.2', '15.8.3', '15.8.4', '15.8.5', '15.8.6',
  '16.0 Beta 1-6', '16.0', '16.0.1', '16.0.2', '16.0.3', '16.1', '16.1.1', '16.1.2', '16.2', '16.3', '16.3.1', '16.4', '16.4.1', '16.5', '16.5.1', '16.6', '16.6.1', '16.7 RC', '16.7', '16.7.1', '16.7.2', '16.7.3', '16.7.4', '16.7.5', '16.7.6', '16.7.7', '16.7.8', '16.7.9', '16.7.10', '16.7.11', '16.7.12','16.7.13','16.7.14', 
  '17.0 Beta 1-5', '17.0', '17.0.1', '17.0.2', '17.0.3', '17.1', '17.1.1', '17.1.2', '17.2', '17.2.1', '17.3', '17.3.1', '17.4', '17.4.1', '17.5', '17.5.1', '17.6', '17.6.1', '17.6.2', '17.7',
  '18.0', '18.0.1', '18.1', '18.2', '18.2.1', '18.3', '18.3.1', '18.3.2', '18.4', '18.4.1', '18.5', '18.6', '18.6.1', '18.6.2', '18.7', '18.7.1', '18.7.2', '18.7.3', '18.7.4', '18.7.5',
  '26.0', '26.1', '26.2', '26.3'
];

var selectedDevice = null;
var selectedArchitecture = 'arm64';
var iosVersion = null;
var pickerDevice;
var pickerVersion;

function compareVersionNumeric(v1, v2) {
  const v1Parts = v1.replace(/ [a-zA-Z]+ \d+/, '').replace(' RC', '').split('.').map(Number);
  const v2Parts = v2.replace(/ [a-zA-Z]+ \d+/, '').replace(' RC', '').split('.').map(Number);
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function openDevicePicker() {
  if (pickerDevice) {
    pickerDevice.open();
    return;
  }
  pickerDevice = app.picker.create({
    inputEl: '#chooseDevice',
    openIn: 'popover', 
    cols: [{
      textAlign: 'center',
      values: deviceList.map(device => device.model)
    }],
    on: {
      change(picker, values) {
        const device = deviceList.find(d => d.model === values[0]);
        selectedDevice = device;
        selectedArchitecture = device ? device.architecture : 'arm64';
        document.getElementById('chooseDevice').innerText = selectedDevice ? selectedDevice.model : 'Choose Device';
        
        iosVersion = null;
        document.getElementById('chooseVersion').innerText = 'Choose Version';
        if (pickerVersion) {
          pickerVersion.destroy();
          pickerVersion = null;
        }
      }
    }
  });
  pickerDevice.open();
}

function openVersionPicker() {
  if (!selectedDevice) {
    app.dialog.alert('Please select a device first!');
    return;
  }
  if (pickerVersion) {
    pickerVersion.destroy();
  }
  
  const compatibleVersions = iosVersions.filter(version => {
     const isAboveMin = compareVersionNumeric(version, selectedDevice.minVersion) >= 0;
     const isBelowMax = compareVersionNumeric(version, selectedDevice.maxVersion) <= 0;
     return isAboveMin && isBelowMax;
  });

  pickerVersion = app.picker.create({
    inputEl: '#chooseVersion',
    openIn: 'popover', 
    cols: [{
      textAlign: 'center',
      values: compatibleVersions
    }],
    on: {
      change(picker, values) {
        iosVersion = values[0];
        document.getElementById('chooseVersion').innerText = iosVersion;
      }
    }
  });
  pickerVersion.open();
}

function checkSupport() {
  const supportInfoElement = document.getElementById('trollstore-support');
  if (!selectedDevice || !iosVersion) {
    app.dialog.alert('Please select a device and an iOS version!');
    return;
  }

  const isSupported = supportedVersions.includes(iosVersion);
  const supportMessage = isSupported ? 'Supported!🎉' : 'Unsupported😔';
  const color = isSupported ? 'green' : 'red';

  const supportDetails = `Device Model: ${selectedDevice.model}<br>
                          iOS Version: ${iosVersion}<br>
                          Architecture: ${selectedArchitecture}<br>
                          <span style="color: ${color};font-weight:bold;font-size:20px;">${supportMessage}</span>`;

  supportInfoElement.innerHTML = supportDetails;
  supportInfoElement.style.color = color;

  const cfwButton = document.getElementById('cfwButton');
  if(cfwButton) {
      cfwButton.style.display = isSupported ? 'block' : 'none';
  }
}

function displayiOSVersion() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const iOSVersionElement = document.getElementById("ios-version");
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    const match = userAgent.match(/OS (\d+_\d+(_\d+)?)/);
    if (match) {
      const iOSVersion = match[1].replace(/_/g, '.');
      iOSVersionElement.textContent = `${iOSVersion}`;
    } else {
      iOSVersionElement.textContent = "iOS version not detected.";
    }
  } else {
    iOSVersionElement.textContent = "Not an iOS device";
  }
}

displayiOSVersion();