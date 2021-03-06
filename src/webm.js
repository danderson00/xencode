module.exports = (function () {
    var ebmlEncode = function (value) {
        if (value <= 0x7f) {
        value |= 0x80;
        return [value];
        } else if (value <= 0x3fff) {
        value |= 0x4000;
        return [(value & 0xff00) >> 8,
            value & 0xff];
        } else if (value <= 0x1fffff) {
        value |= 0x200000;
        return [(value & 0xff0000) >> 16,
            (value & 0xff00) >> 8,
            value & 0xff];
        } else if (value <= 0x0fffffff) {
        value |= 0x10000000;
        return [(value & 0xff000000) >> 24,
            (value & 0xff0000) >> 16,
            (value & 0xff00) >> 8,
            value & 0xff];
        } else {
        throw ("cannot encode value: " + value);
        }
    }

    var encodeBytes = function (value) {
        var reversed = [];
        if (value == 0) {
        reversed.push(0);
        } else {
        while (value) {
            reversed.push(value & 0xff);
            value >>= 8;
        }
        }
        var encoded = [];
        for (var i=reversed.length-1; i>=0; i--) {
        encoded.push(reversed[i]);
        }
        return encoded;
    }

    var encodeString = function (string) {
        var encoded = [];
        for (var i=0; i<string.length; i++) {
        encoded.push(string.charCodeAt(i));
        }
        return encoded;
    }

    // This function is mostly taken from the whammy.js function 'doubleToString'
    var encodeFloat = function (num){
        result = [].slice.call(
        new Uint8Array(
            (
            new Float64Array([num]) //create a float64 array
            ).buffer) //extract the array buffer
        , 0) // convert the Uint8Array into a regular array
        // .map(function(e){ //since it's a regular array, we can now use map
        //     return String.fromCharCode(e) // encode all the bytes individually
        // })
        .reverse() //correct the byte endianness (assume it's little endian for now)
        // .join('') // join the bytes in holy matrimony as a string
        return result
    }

    var EBMLMasterElement = function (id) {
        this.id = id;
        this.children = [];
    }

    EBMLMasterElement.prototype.encode = function () {
        var encoded_id = ebmlEncode(this.id);
        var encoded_children = [];
        for (var i=0; i<this.children.length; i++) {
        encoded_children = encoded_children.concat(this.children[i].encode());
        }
        var size = encoded_children.length;
        var encoded_size = ebmlEncode(size);
        var encoded = [];
        encoded = encoded.concat(encoded_id);
        encoded = encoded.concat(encoded_size);
        encoded = encoded.concat(encoded_children);
        return encoded;
    }

    var EBMLUnsignedIntElement = function (id, value) {
        this.id = id;
        this.value = value;
    }

    EBMLUnsignedIntElement.prototype.encode = function () {
        var encoded_id = ebmlEncode(this.id);
        var encoded_value = encodeBytes(this.value);
        var size = encoded_value.length;
        var encoded_size = ebmlEncode(size);
        var encoded = [];
        encoded = encoded.concat(encoded_id);
        encoded = encoded.concat(encoded_size);
        encoded = encoded.concat(encoded_value);
        return encoded;
    }

    var EBMLStringElement = function (id, value) {
        this.id = id;
        this.value = value;
    }

    EBMLStringElement.prototype.encode = function () {
        var encoded_id = ebmlEncode(this.id);    
        var encoded_value = encodeString(this.value);
        var size = encoded_value.length;
        var encoded_size = ebmlEncode(size);
        var encoded = [];
        encoded = encoded.concat(encoded_id);
        encoded = encoded.concat(encoded_size);
        encoded = encoded.concat(encoded_value);
        return encoded;
    }

    var EBMLFloatElement = function (id, value) {
        this.id = id;
        this.value = value;
    }

    EBMLFloatElement.prototype.encode = function () {
        var encoded_id = ebmlEncode(this.id);    
        var encoded_value = encodeFloat(this.value);
        var size = encoded_value.length;
        var encoded_size = ebmlEncode(size);
        var encoded = [];
        encoded = encoded.concat(encoded_id);
        encoded = encoded.concat(encoded_size);
        encoded = encoded.concat(encoded_value);
        return encoded;
    }

    var EBMLBinaryElement = function (id, value) {
        this.id = id;
        this.value = value;
    }

    EBMLBinaryElement.prototype.encode = function () {
        var encoded_id = ebmlEncode(this.id);    
        var encoded_value = this.value;
        var size = encoded_value.length;
        var encoded_size = ebmlEncode(size);
        var encoded = [];
        encoded = encoded.concat(encoded_id);
        encoded = encoded.concat(encoded_size);
        encoded = encoded.concat(encoded_value);
        return encoded;
    }

    var EBMLElementType = function (id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }

    var EBMLElementSpecs = [
        [0x1a45dfa3, 'EBML',               'element'],
        [0x4286,     'EBMLVersion',        'uint'],
        [0x42f7,     'EBMLReadVersion',    'uint'],
        [0x42f2,     'EBMLMaxIDLength',    'uint'],
        [0x42f3,     'EBMLMaxSizeLength',  'uint'],
        [0x4282,     'DocType',            'string'],
        [0x4287,     'DocTypeVersion',     'uint'],
        [0x4285,     'DocTypeReadVersion', 'uint'],
        [0x18538067, 'Segment',            'element'],
        [0x1549a966, 'Info',               'element'],
        [0x73a4,     'SegmentID',          'binary'],
        [0x2ad7b1,   'TimecodeScale',      'uint'],
        [0x4d80,     'MuxingApp',          'string'],
        [0x5741,     'WritingApp',         'string'],
        [0x4489,     'Duration',           'float'],
        [0x1654ae6b, 'Tracks',             'element'],
        [0xae,       'TrackEntry',         'element'],
        [0xd7,       'TrackNumber',        'uint'],
        [0x63c5,     'TagTrackUID',        'uint'],
        [0x9c,       'FlagLacing',         'uint'],
        [0x22b59c,   'Language',           'string'],
        [0x86,       'CodecID',            'string'],
        [0x258688,   'CodecName',          'string'],
        [0x83,       'TrackType',          'uint'],
        [0xe0,       'Video',              'element'],
        [0xb0,       'PixelWidth',         'uint'],
        [0xba,       'PixelHeight',        'uint'],
        [0x1f43b675, 'Cluster',            'element'],
        [0xe7,       'Timecode',           'uint'],
        [0xa3,       'SimpleBlock',        'simpleblock']
    ];
    var EBMLElementTypes = {};
    for (var i=0; i<EBMLElementSpecs.length; i++) {
        var spec = EBMLElementSpecs[i];
        EBMLElementTypes[spec[0]] = new EBMLElementType(spec[0], spec[1], spec[2]);
    }

    var EBMLElement = function (type) {
        this.type = type;
        this.value = null;
        this.children = [];
    }

    EBMLElement.prototype.toString = function () {
        var repr = "(0x" + this.type.id.toString(16) + "::" + this.type.name + "::";
        if (this.value) {
        repr += "{" + this.value.toString() + "}";
        } else {
        repr += "{" + this.children.join(",") + "}";
        }
        return repr + ")";
    }

    var EBMLBuffer = function (buffer) {
        this._index = 0;
        this._buffer = buffer;
    }

    EBMLBuffer.prototype.empty = function () {
        return this._index >= this._buffer.length;
    }

    EBMLBuffer.prototype.peekByte = function () {
        if (this._index + 1 > this._buffer.length) {
        throw "IndexError: Can't peek 1 byte";
        }
        return this._buffer[this._index];
    }

    EBMLBuffer.prototype.consumeByte = function () {
        if (this._index + 1 > this._buffer.length) {
        throw "IndexError: Can't consume 1 byte";
        }
        var vtr = this._buffer[this._index];
        this._index += 1
        return vtr
    }

    EBMLBuffer.prototype.consumeBytes = function (n) {
        var value = [];
        if (!!n) {
        while (n > 0) {
            value.push(this.consumeByte());
            n -= 1;
        }
        } else {
        while (!this.empty()) {
            value.push(this.consumeByte());
        }
        }
        return value;
    }

    EBMLBuffer.prototype.consumeInteger = function (n) {
        var value = 0;
        while (n > 0) {
        value = (value << 8) + this.consumeByte();
        n -= 1;
        }
        return value;
    }

    EBMLBuffer.prototype.consumeString = function (n) {
        var value = "";
        while (n > 0) {
        value += String.fromCharCode(this.consumeByte());
        n -= 1;
        }
        return value;
    }

    EBMLBuffer.prototype._peekLength = function () {
        var lengthDescriptor = this.peekByte();
        var length = 1;
        var lengthMask = 0x80;
        while ((lengthMask & lengthDescriptor) == 0) {
        length += 1;
        lengthMask >>= 1;
        }
        return length;
    }

    EBMLBuffer.prototype.consumeCodedID = function () {
        var length = this._peekLength();
        return this.consumeInteger(length)
    }

    EBMLBuffer.prototype.consumeCodedValue = function () {
        var length = this._peekLength();
        var valueMask = 0xff;
        valueMask >>= length;
        for (var i=0; i<length-1; i++) {
        valueMask = (valueMask << 8) | 0xff;
        }
        return this.consumeInteger(length) & valueMask;
    }
    EBMLBuffer.prototype.consumeCodedLength = EBMLBuffer.prototype.consumeCodedValue;

    EBMLBuffer.prototype.toString = function () {
        return this._buffer.slice(this._index, this._buffer.length).toString('utf8');
    }

    var SimpleBlock = function (trackNumber, timecode, frames) {
        this.trackNumber = trackNumber;
        this.timecode = timecode;
        this.frames = frames;
    }

    // SimpleBlock.parse = function (bytes) {
    //     var buffer = new EBMLBuffer(bytes);
    //     var trackNumber = buffer.consumeByte();
    // }

    SimpleBlock.prototype.toString = function () {
        var repr = "SimpleBlock{trackNumber: " + this.trackNumber;
        repr += ", timecode: " + this.timecode;
        repr += ", frames: " + this.frames + "}";
        return repr;
    }

    SimpleBlock.prototype.bytes = function () {
        return this.frames[0];
    }

    SimpleBlock.fromVorbisPacket = function (trackNumber, timecode, packet) {
        var simpleBlock = [0x81, (timecode & 0xff00) >> 8, timecode & 0xff];
        var flags = 0x00;
        simpleBlock.push(flags);	
        simpleBlock = simpleBlock.concat([].slice.call(packet.bytes, 0));
        return new SimpleBlock(trackNumber, timecode, [simpleBlock]);
    }

    SimpleBlock.fromVP8Frame = function (trackNumber, timecode, frame) {
        var simpleBlock = [0x81, (frame.timecode & 0xff00) >> 8, frame.timecode & 0xff];
        var flags = 0;
        if (frame.keyframe) {
        flags |= 0x80;
        }
        simpleBlock.push(flags);	
        simpleBlock = simpleBlock.concat([].slice.call(frame.data, 0));
        return new SimpleBlock(trackNumber, timecode, [simpleBlock]);
    }

    var WebMParser = function () {
    }

    WebMParser.prototype.parseID = function (buffer) {
        return buffer.consumeCodedID();
    }

    WebMParser.prototype.parseLength = function (buffer) {
        return buffer.consumeCodedLength();
    }

    WebMParser.prototype.parseSimpleBlock = function (bytes) {
        var buffer = new EBMLBuffer(bytes);
        var trackNumber = buffer.consumeCodedValue();
        var timecode = buffer.consumeInteger(2);
        var flags = buffer.consumeBytes(1);
        var lacing = (flags & 0x06) >> 1;
        if (lacing != 0) {
        throw ("NotImplementedError: Don't know how to parse lacing: " + lacing);
        }
        var frame = buffer.consumeBytes();
        return new SimpleBlock(trackNumber, timecode, [frame]);
    }

    WebMParser.prototype.parse = function (data) {
        var buffer = new EBMLBuffer(data);
        var elements = [];
        while (!buffer.empty()) {
        var id = this.parseID(buffer);
        var elementType = EBMLElementTypes[id];
        if (!elementType) {
            throw ("No such type: 0x" + id.toString(16));
        }
        var element = new EBMLElement(elementType);
        
        var valueLength = this.parseLength(buffer);
        if (elementType.type == 'element') {
            var value = buffer.consumeBytes(valueLength);
            var values = this.parse(value);
            for (var i=0; i<values.length; i++) {
            element.children.push(values[i]);
            }
        } else if (elementType.type == 'string') {
            element.value = buffer.consumeString(valueLength).toString();
        } else if (elementType.type == 'uint') {
            element.value = buffer.consumeInteger(valueLength);
        } else if (elementType.type == 'binary') {
            element.value = buffer.consumeBytes(valueLength);
        } else if (elementType.type == 'float') {
            element.value = buffer.consumeBytes(valueLength);
        } else if (elementType.type == 'simpleblock') {
            var bytes = buffer.consumeBytes(valueLength);
            element.value = this.parseSimpleBlock(bytes);
        }
        elements.push(element);
        }
        return elements;
    }

    this.parseWebM = function (buffer) {
        var parser = new WebMParser();
        return parser.parse(buffer);
    }

    var VP8Frame = function (frame) {
        this._frame = frame;
    }

    VP8Frame.prototype.timecode = function () {
        return this._frame.timecode;
    }

    VP8Frame.prototype.toSimpleBlock = function (trackNumber, clusterTimecode) {
        var relativeTimecode = this.timecode() - clusterTimecode;
        return SimpleBlock.fromVP8Frame(trackNumber, relativeTimecode, this._frame);
    }

    var VorbisPacket = function (packet) {
        this._packet = packet;
    }

    VorbisPacket.prototype.timecode = function () {
        return this._packet.timecode;
    }

    VorbisPacket.prototype.toSimpleBlock = function (trackNumber, clusterTimecode) {
        var relativeTimecode = this.timecode() - clusterTimecode;
        return SimpleBlock.fromVorbisPacket(trackNumber, relativeTimecode, this._packet);
    }

    var WebMVideoTrack = this.WebMVideoTrack = function (width, height, framerate, frames) {
        this.width = width;
        this.height = height;
        this.framerate = framerate;
        this.frames = frames.map(function (frame) { return new VP8Frame(frame) });
    }

    WebMVideoTrack.prototype.duration = function () {
        return this.frames.length * 1000 / this.framerate;
    }

    WebMVideoTrack.prototype.content = function () {
        return this.frames;
    }

    WebMVideoTrack.prototype.EBMLTrackEntry = function (trackNumber) {
        var trackEntry = new EBMLMasterElement(0x2e);
        // TrackNumber
        trackEntry.children.push(new EBMLUnsignedIntElement(0x57, trackNumber));
        // FlagLacing
        trackEntry.children.push(new EBMLUnsignedIntElement(0x1c, 0));
        // Language
        trackEntry.children.push(new EBMLStringElement(0x02b59c, 'und'));
        // CodecID
        trackEntry.children.push(new EBMLStringElement(0x06, 'V_VP8'));
        // CodecName
        trackEntry.children.push(new EBMLStringElement(0x058688, 'VP8'));
        // TrackType
        trackEntry.children.push(new EBMLUnsignedIntElement(0x03, 1));
        var video = new EBMLMasterElement(0x60);
        trackEntry.children.push(video);
        video.children.push(new EBMLUnsignedIntElement(0x30, this.width));
        video.children.push(new EBMLUnsignedIntElement(0x3a, this.height));
        return trackEntry;
    }

    var WebMAudioTrack = this.WebMAudioTrack = function (sampleRate, channels, bitDepth, priv, duration, packets) {
        this.sampleRate = sampleRate;
        this.channels = channels;
        this.bitDepth = bitDepth;
        this.priv = priv;
        this._duration = duration;
        this.packets = packets.map(function (packet) {
        return new VorbisPacket(packet)
        });
    }

    WebMAudioTrack.prototype.duration = function () {
        // console.log(this.packets[this.packets.length-1].toString());
        return this._duration;
    }

    WebMAudioTrack.prototype.content = function () {
        return this.packets;
    }

    WebMAudioTrack.prototype.EBMLTrackEntry = function (trackNumber) {
        var trackEntry = new EBMLMasterElement(0x2e);
        // TrackNumber
        trackEntry.children.push(new EBMLUnsignedIntElement(0x57, trackNumber));
        // TrackUID
        trackEntry.children.push(new EBMLUnsignedIntElement(0x33c5, trackNumber));
        // FlagLacing
        trackEntry.children.push(new EBMLUnsignedIntElement(0x1c, 0));
        // Language
        trackEntry.children.push(new EBMLStringElement(0x02b59c, 'und'));
        // CodecID
        trackEntry.children.push(new EBMLStringElement(0x06, 'A_VORBIS'));
        // TrackType
        trackEntry.children.push(new EBMLUnsignedIntElement(0x03, 2));
        // Audio
        var audio = new EBMLMasterElement(0x61);
        trackEntry.children.push(audio);
        // Channels
        audio.children.push(new EBMLUnsignedIntElement(0x1f, this.channels));
        // SamplingFrequency
        audio.children.push(new EBMLFloatElement(0x35, this.sampleRate));
        // BitDepth
        audio.children.push(new EBMLUnsignedIntElement(0x2264, this.bitDepth));
        // CodecPrivate
        trackEntry.children.push(new EBMLBinaryElement(0x23a2, this.priv));
        return trackEntry;
    }

    var WebMContainer = this.WebMContainer = function (videoTrack, audioTrack) {
        this.audio = audioTrack;
        this.video = videoTrack;
    };

    WebMContainer.prototype.EBMLHeader = function () {
        var EBML = new EBMLMasterElement(0x0a45dfa3);
        EBML.children.push(new EBMLUnsignedIntElement(0x0286, 1));
        EBML.children.push(new EBMLUnsignedIntElement(0x02f7, 1));
        EBML.children.push(new EBMLUnsignedIntElement(0x02f2, 4));
        EBML.children.push(new EBMLUnsignedIntElement(0x02f3, 8));
        EBML.children.push(new EBMLStringElement(0x0282, 'webm'));
        EBML.children.push(new EBMLUnsignedIntElement(0x0287, 1));
        EBML.children.push(new EBMLUnsignedIntElement(0x0285, 1));
        return EBML;
    }

    WebMContainer.prototype.frameToSimpleBlock = function (frame) {
        var simpleBlock = [0x81, (frame.timecode & 0xff00) >> 8, frame.timecode & 0xff];
        var flags = 0;
        if (frame.keyframe) {
        flags |= 0x80;
        }
        simpleBlock.push(flags);	
        simpleBlock = simpleBlock.concat([].slice.call(frame.data, 0));
        return simpleBlock;
    }

    var ContentIterator = function () {
        var tracks = [].slice.call(arguments, 0);
        this.contentLists = [];
        for (var i=0; i<tracks.length; i++) {
        if (tracks[i]) {
            this.contentLists.push(tracks[i].content());
        }
        }
    }

    ContentIterator.prototype.next = function () {
        var nextListIndex = -1;
        for (var i=0; i<this.contentLists.length; i++) {
        if (nextListIndex == -1) {
            nextListIndex = i;
        } else if (this.contentLists[i][0] &&
            this.contentLists[i][0].timecode <
            this.contentLists[nextListIndex][0].timecode) {
            nextListIndex = i
        }
        }
        return [i+1, this.contentLists[nextListIndex].shift()];
    }

    ContentIterator.prototype.empty = function () {
        for (var i=0; i<this.contentLists.length; i++) {
        if (this.contentLists[i].length > 0) return false
        }
        return true;
    }

    WebMContainer.prototype.Segment = function () {
        var segment = new EBMLMasterElement(0x08538067);
        
        // Info
        var info = new EBMLMasterElement(0x549a966);
        segment.children.push(info);
        // TimecodeScale
        info.children.push(new EBMLUnsignedIntElement(0x0ad7b1, 1000000));
        // MuxingApp
        info.children.push(new EBMLStringElement(0x0d80, 'libvpx.js'));
        // WritingApp
        info.children.push(new EBMLStringElement(0x1741, 'libvpx.js'));
        // Duration
        if (this.video && this.audio &&
        this.video.duration() > this.audio.duration()) {
        duration = this.video.duration();
        } else if (this.video) {
        duration = this.video.duration();
        } else if (this.audio) {
        duration = this.audio.duration();
        }
        console.log("duration:", duration >> 0);
        info.children.push(new EBMLFloatElement(0x0489, duration >> 0));
        
        var tracks = new EBMLMasterElement(0x0654ae6b);
        segment.children.push(tracks);
        
        var trackNumber = 1;
        if (this.audio) {
        this.audio.trackNumber = trackNumber;
        var trackEntry = this.audio.EBMLTrackEntry(trackNumber);
        tracks.children.push(trackEntry);
        trackNumber = 2;
        }
        if (this.video) {
        this.video.trackNumber = trackNumber;
        var trackEntry = this.video.EBMLTrackEntry(trackNumber);
        tracks.children.push(trackEntry);
        }
        var contents = new ContentIterator(this.audio, this.video);
        var MAX_CLUSTER_LENGTH = 30000;
        var clusterTimecode = 0;
        var cluster = new EBMLMasterElement(0x0f43b675);
        segment.children.push(cluster);
        // Timecode
        cluster.children.push(new EBMLUnsignedIntElement(0x67, clusterTimecode));
        while (!contents.empty()) {
        var nextContentInfo = contents.next();
        var nextTrackNumber = nextContentInfo[0];
        var nextContent = nextContentInfo[1];
        if (nextContent.timecode() - clusterTimecode > MAX_CLUSTER_LENGTH) {
            cluster = new EBMLMasterElement(0x0f43b675);
            segment.children.push(cluster);
            clusterTimecode = nextContent.timecode();
        }
        var simpleBlock = nextContent.toSimpleBlock(nextTrackNumber,
                                clusterTimecode);
        cluster.children.push(new EBMLBinaryElement(0x23, simpleBlock.bytes()));
        };
        return segment;
    }

    WebMContainer.prototype.toBuffer = function () {
        var header = this.EBMLHeader();
        var segment = this.Segment();
        return (new Uint8Array(header.encode().concat(segment.encode()))).buffer;
    }

    WebMContainer.prototype.toDataURL = function () {
        var header = this.EBMLHeader();
        var segment = this.Segment();
        var data = header.encode().concat(segment.encode());
        var buffer = data.map(function (b) {
        if (b < 0) { b += 256 };
        return String.fromCharCode(b);
        });
        return 'data:video/webm;base64,' + btoa(buffer.join(''));
    }

    this.WebMContainer = WebMContainer;    

    return this;
})()
