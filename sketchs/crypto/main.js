function setup() {
  noCanvas();
  noLoop();
  var div = $('<div id="out">');
  var select = $(`
    <select>  
      <option value="hex">Hexadecimal</option>
      <option value="raw" selected="selected">Unicode</option>
      <option value="json">JSON</option>
    </select>
  `);
  var select2 = $(`
    <select>  
      <option value="true">Realtime</option>
      <option value="false" selected="selected">Manual</option>
    </select>
  `);
  var len = 10;
  var source = "122";
  var displayMode = 'raw';
  var realTimeUpdate = false;
  var fn = e => {
    if(realTimeUpdate == "true")realTimeUpdate = true;
    if(realTimeUpdate == "false")realTimeUpdate = false;
    if(!realTimeUpdate&&!e)return;
    div.html(hashWrapper(source,len,displayMode))
  };

  select.change(() => {displayMode = select.val();fn(true)});
  select2.change(() => {realTimeUpdate = select2.val();fn()});
  var b1 = makeTextbox((e,k) => {source = e;fn(k == 13)});
  b1.val(source);
  $('body').append($('<div>').append("source:").append(b1).append(select));
  var b2 = makeTextbox((e,k) => {len    = e;fn(k == 13)});
  b2.val(len);
  $('body').append($('<div>').append("length:").append(b2).append(select2));

  $('body').append(div);
  fn(true);
}

function makeTextbox(f /*void(string)*/){
  var width = /*window.width||*/500;
  var r = $(
    '<input type="text" style="width: {0}px;display: inline-block;margin: 0;">'
    .format(round(width)));
  $('body').append(r);
  var f1 = e => {
    f(r.val(),e.type == "keydown"?e.keyCode:-1);
  };
  r.keyup(f1).keydown(f1).change(f1);
  return r;
}

function hashWrapper(val,len,displayMode){
  var t = (new Date).getTime();
  var r = hash(val,len);
  var t2 = (new Date).getTime();
  print('hash took {0} ms'.format((t2-t)));
  if(typeof r == "string"/*!Array.isArray(r)*/)return r;
  if(r === undefined)return "undefined";
  if(displayMode == 'raw'){
    selfMap(r,e => String.fromCharCode(e));
    return joinHelper(r,'');
  }else if(displayMode == 'json'){
    return JSON.stringify(r);
  }else if(displayMode == 'hex'){
    selfMap(r,e => formatNumber(e,16,2));
    return joinHelper(r,' ');
  }else{
    throw "invalid displayMode";
  }
}

function formatNumber(num,base,len){
  if(len === undefined)return num.toString(base);
  var r = num.toString(base);
  if(r.length == len)return r;
  if(r.length > len){
    throw "formatNumber:length too small";
    r.length = len;//i do not know
    return r;
  }
  while(r.length < len){
    r = "0"+r;
  }
  return r;
}

function selfMap(arr,fn){
  var l = arr.length;
  for (var i = 0; i < l; i++) {
    arr[i] = fn(arr[i],i,arr);
  }
  return arr;
}

function selfConcat(dest,source){
  var l = dest.length;
  var l2 = source.length;
  for (var i = 0; i < l2; i++) {
    dest[l+i] = source[i];
  }
  return dest;
}

function joinHelper(arr,gap){
  var r = '';
  for (var i = 0; i < arr.length; i++) {
    r += arr[i];
    if(i != arr.length-1)r += gap;
  }
  return r;
}

function hash(val,len1){
  val = val.split("").map(e => e.charCodeAt(0)).map(e => e&0xff);

  supersuffle(val);
  var r = [];
  var prev = [0,0,0,0];
  var len = max(len1,8);
  var t = [],t2 = [],j,tj;
  for (var i = 0; i < len; i+=4) {
    for (j = 0; j < 4; j++){
      t2[j] = val[i+j]?val[i+j]:0;
    }
    t = keyScheduleCore(t2,i);
    tj = r.length;
    for (j = 0; j < 4; j++){
      t[j] ^= prev[j];
      r[tj+j] = t[j];
    }
    if(val.length<len)
      selfConcat(val,r);//i am not sure what this line should be
    prev = t;
  }
  r.length = len;
  supersuffle(r);
  r.length = len1;
  return r;
}

var suffleRandomness = 99;
function suffle256(/*uint8[256]*/ arr){
  var t,ti;
  for (var i = 0; i < arr.length; i++) {
    t = arr[i];
    ti = (t+i*suffleRandomness)&0xff;
    if(arr.length != 256){
      //ti = floor(ti/256*arr.length)%arr.length;
      ti = ti%arr.length;
    }
    arr[i] = arr[ti];
    arr[ti] = t;
  }
  return arr;
}

function supersuffle256(arr){
  var fn = (e,i) => (e+i)&0xff;
  for (var i = 0; i < 10; i++) {
    selfMap(arr,fn);
    suffle256(arr);
  }
  return arr;
}

function supersuffle(arr){
  if(arr.length<=256)return supersuffle256(arr);
  var len = Math.ceil(arr.length/256);
  for (var i = 0; i < len; i++) {
    var t = supersuffle256(arr.slice(i*256, min((i+1)*256,arr.length) ));
    for (var j = 0; j < t.length; j++) {
      arr[j+i*256] = t[j];
    }
  }
  return arr;
}

var rcon = [//rom
  0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 
  0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 
  0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 
  0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 
  0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 
  0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 
  0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 
  0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 
  0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 
  0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 
  0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 
  0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 
  0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 
  0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 
  0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 
  0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d
];

var sbox = [//rom
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

function keyScheduleCore(/*uint8[4]*/ arr,i,r) {
  if(i == undefined)i = 0;
  if(r == undefined)r = [];
  r[0] = sbox[arr[1]];
  r[1] = sbox[arr[2]];
  r[2] = sbox[arr[3]];
  r[3] = sbox[arr[0]];
  r[0] ^= rcon[i];
  return r;
}