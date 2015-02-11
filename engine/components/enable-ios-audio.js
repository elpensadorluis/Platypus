/**
# COMPONENT **enable-ios-audio**
This component enables JavaScript-triggered audio play-back on iOS devices by overlaying an invisible `div` across the game area that, when touched, causes the audio track to play, giving it necessary permissions for further programmatic play-back. Once touched, it removes itself as a component from the entity as well as removes the layer `div` DOM element.

## Dependencies:
- [createjs.SoundJS] [link1] - This component requires the SoundJS library to be included for audio functionality.
- **rootElement** property (on entity) - This component requires a DOM element which it uses to overlay the touchable audio-instantiation layer `div`.

## JSON Definition:
    {
      "type": "enable-ios-audio",
      
      "audioId": "combined",
      // Required. The SoundJS audio id for the audio clip to be enabled for future play-back.
    }

[link1]: http://www.createjs.com/Docs/SoundJS/module_SoundJS.html
*/
(function(){
	var iOSAudioEnabled = false,
    fileLoaded = false,
    userTapped = false,
    callback   = null,
	setupLoader = function(element, audio){
    	var tag = null,
    	succeeded = null,
    	loading = function () {
			var buffered = [],
			total = 0,
			percent = 0;
			
			if(!tag && audio._playbackResource){
				// The audio.tag reference seems to disappear once the audio is paused, so we hold on to it for progress checking.
				tag = audio._playbackResource;
				if(tag.src !== tag.id){ // This is a workaround for a bug in CreateJS: HTMLAudioPlugin, _handleTagLoad()
					tag.id = tag.src;
				}
				document.title = tag.id + ' ' + platformer.settings.supports.audioAPI;
			}
				
			if(tag){
				buffered = tag.buffered;

				for (var i = 0, len = buffered.length; i < len; i++) {
				    total += (buffered.end(i) - buffered.start(i));
				}

				percent = (Math.floor((total * 100) / tag.duration) || 0);
				element.innerHTML = 'Loading Audio: ' + percent + '%';
				
				if(percent >= 100){
					clearInterval(interval);
					userTapped = true;
					if(fileLoaded && callback){
	        			callback();
					}
				} else if(!succeeded){
			    	succeeded = function () {
					    tag.removeEventListener('play', succeeded);
					    audio.pause();
					};
					tag.addEventListener('play', succeeded);
				}
			}
		},
		interval = setInterval(loading, 500);
		
		element.innerHTML = 'Loading Audio...';
		element.className = 'loading-audio';
	},
	enableIOSAudio  = function(element, audioId){
		var click   = null,
		audioPath   = '',
	    overlay     = document.createElement('div');
		
		overlay.style.width    = '100%';
		overlay.style.height   = '100%';
		overlay.style.position = 'absolute';
		overlay.style.zIndex   = '100';
		element.appendChild(overlay);

		click = function(e){
			overlay.removeEventListener('touchstart', click, false);
			
			if(fileLoaded){
    			if(callback){
        			callback();
    			}
		    } else {
		    	audioPath = createjs.Sound.createInstance(audioId).src;
		    	if(audioPath){
			    	createjs.Sound.removeSound(audioId);
			    	createjs.Sound.registerSound(audioPath, audioId, 1);
			    	if(platformer.settings.supports.audioAPI){
			    		if(callback){
		        			callback();
		    			}
			    	} else {
						setupLoader(overlay, createjs.Sound.play(audioId));
			    	}
		    	} else {
		    		console.warn('Component "enable-ios-audio": Invalid audio path.');
		    		if(callback){
	        			callback();
	    			}
		    	}
		    }
		};
		overlay.addEventListener('touchstart', click, false);
		
		return overlay;
	};

	createjs.Sound.addEventListener('fileload', function(){
		fileLoaded = true;
		if(userTapped && callback){
   			callback();
		}
	});

	return platformer.createComponentClass({
		id: 'enable-ios-audio',
		constructor: function(definition){
			var self = this;
			
			iOSAudioEnabled = iOSAudioEnabled || !platformer.settings.supports.iOS || platformer.settings.supports.audioAPI;
			
			if(!iOSAudioEnabled){
				iOSAudioEnabled = true;
				this.touchOverlay = enableIOSAudio(this.owner.rootElement, definition.audioId);
				callback = function(){
					callback = null;
					self.owner.triggerEvent('ios-audio-ready');
					self.removeComponent();
				};
			} else {
				this.removeComponent();
			}
		},
		
		methods: {
		    removeComponent: function(){
				this.owner.removeComponent(this);
			},
			destroy: function(){
				if(this.touchOverlay){
					this.owner.rootElement.removeChild(this.touchOverlay);
				}
				delete this.touchOverlay;
			}
		}
	});
})();
