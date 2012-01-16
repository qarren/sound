var Sound = (function ($) {
    var me = {},

        SAMPLE_RATE = 44100, //htz
        SUSTAIN = 200, //ms
        MAX_BUFFERS = 40,
        PI = Math.PI,
        TRACKS = 6,
        TEMPO = 60, //bpm
        NOTES = 8, //notes per beat
        
        DSP = ((new Audio()).mozWriteAudio) ? true : false,
        
        _scale;
        
        if (DSP) {
            _scale = [
                //164.81,
                196.00,
                261.63,
                329.628,
                391.995,
                523.251,
                1046.302
            ];
        }
        else {
            _scale = [
                'C2',
                'E2',
                'G2',
                'C3',
                'E3',
                'G3',
                'C4'
            ];
        }
        
    //Buffers, generates and caches simple sin() buffers for use in signal processing
    me.Buffers = (function () {
        var me = {},
            _buffers = {};
            
        function _genBuffer(freq) {
            var buffer = new Float32Array(SAMPLE_RATE * (SUSTAIN / 1000)),
            
            factor = PI * freq * 2 / SAMPLE_RATE;
            
            for (var i = 0, l = buffer.length; i < l; i++) {
                //buffer[i] = Math.pow(-1, parseInt(i*factor));
                //buffer[i] = Math.sin(i * factor) * Math.exp(-i / 1600);
                buffer[i] = Math.sin(i * factor) * (l - i) / l;
            }
            
            return buffer;
        }
        
        me.get = function (freq) {
            if (!_buffers[freq]) {
                _buffers[freq] = _genBuffer(freq);
            }
            
            return _buffers[freq];
        };
    
        return me;
    }());
    
    //Samples, grabs, caches, and plays sample wav files of a given frequency
    me.Samples = (function () {
        var me = {},
            _samples = {};
            
        function _getSample(note) {
            return new Audio('cello/' + note + '.wav');
        
            if (!_samples[note]) {
                _samples[note] = new Audio('cello/' + note + '.wav');
            }
            
            return _samples[note];
        }
        
        me.play = function (note) {
            _getSample(note).play();
        };
        
        return me;
    }());
    
    //Output, sends a buffer to a given (and generated) audio track using the Audio object
    me.Output = (function () {
        var me = {},
        
            _tracks = {};
            
        function _getTrack(track) {
            if (!_tracks[track]) {
                _tracks[track] = new Audio();
                _tracks[track].mozSetup(1, SAMPLE_RATE); 
            }
            
            return _tracks[track];
        }
        
        me.route = function (track, buffer) {
            _getTrack(track).mozWriteAudio(buffer);
        };
        
        return me;
    }());
    
    //Tracks, generates and controls both the GUI and the underlying track matrix
    me.Tracks = (function (Sound) {
        var me = {},
        
            _tracks = [],
            _nodes = [],
            _interval,
            _prev = 0,
            _location = 0;
            
        //gen tracks
        for (var i = 0, j = 0; i < TRACKS; i++) {
            _tracks[i] = [];
            _nodes[i] = [];
            
            for (j = 0; j < NOTES; j++) {
                _tracks[i][j] = 0;
            }
        }
        
        //gen gui
        var sequencer = $('<div />').addClass('sequencer clearfix'),
            track, node;
            
        for (i = 0; i < TRACKS; i++) {
            track = $('<div />').addClass('track').appendTo(sequencer);
            
            for (j = 0; j < NOTES; j++) {
                node = $('<div />').addClass('node').appendTo(track);
                
                node.click(function (i, j) { 
                    return function () {
                        $(this).toggleClass('on');
                        me.toggle(i, j);
                    }
                }(i, j));
                
                _nodes[i][j] = node;
            }
        }
        sequencer.appendTo(document.body);
        
        function _tick() {
            var prev = _location;
            
            _location++;
            if (_location >= NOTES) {
                _location = 0;
            }
        
            for (var i = 0; i < TRACKS; i++) {
                if (_tracks[i][prev]) {
                    if (DSP) {
                        Sound.Output.route(i, Sound.Buffers.get(_scale[i]));
                    }
                    else {
                        Sound.Samples.play(_scale[i]);
                    }
                }
            }
            
            _paintColumn(prev, 1);
            setTimeout(function () {
                _paintColumn(prev, 0);
            }, 100);
        }
        
        function _paintColumn(col, on) {
            if (on) {
                for (var i = 0; i < TRACKS; i++) {
                    _nodes[i][col].addClass('ticked');
                }
            }
            else {
                for (var i = 0; i < TRACKS; i++) {
                    _nodes[i][col].removeClass('ticked');
                }
            }
        }
        
        me.toggle = function (track, location) {
            if (_tracks[track][location]) {
                _tracks[track][location] = 0;
            }
            else {
                _tracks[track][location] = 1;
            }
            
            return _tracks[track][location];
        };
        
        me.start = function () {
            if (_interval) {
                return;
            }
            
            var interval = 60000 / (TEMPO * NOTES);
            
            _interval = setInterval(_tick, interval);
        };
        
        me.stop = function () {
            clearInterval(_interval);
            _interval = 0;
        };
        
        return me;
    }(me));

    me.test = function () {
        me.Tracks.start();
    };
    
    return me;
}(jQuery));