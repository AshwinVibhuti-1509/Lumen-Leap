/** Entirely synthesized sound: no licensed samples or external assets. */
export default class GameAudio {
  constructor(){this.enabled=true;this.music=false;this.ctx=null;this.lastMusic=-Infinity;}
  ready(){if(!this.enabled)return;try{this.ctx ??= new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume?.();}catch{this.ctx=null;}}
  note(hz=440,length=.12,volume=.035,type='sine',offset=0){
    if(!this.enabled||!this.ctx)return;
    const t=this.ctx.currentTime+offset;
    const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(hz,t);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+length);
    oscillator.connect(gain);gain.connect(this.ctx.destination);oscillator.start(t);oscillator.stop(t+length+.03);
  }
  effect(name){if(!this.enabled)return;
    if(name==='pickup'){this.note(660,.13);this.note(880,.22,.04,'sine',.1);}
    if(name==='hit'){this.note(190,.22,.06,'sawtooth');}
    if(name==='attack'){this.note(365,.08,.018,'triangle');}
    if(name==='guardian'){this.note(390,.16);this.note(520,.16,.03,'triangle',.12);this.note(780,.28,.03,'triangle',.26);}
    if(name==='win'){[523,659,784,1047].forEach((n,i)=>this.note(n,.32,.04,'sine',i*.16));}
  }
  update(time){if(!this.music||!this.enabled||!this.ctx||time-this.lastMusic<1.5)return;
    this.lastMusic=time;const tones=[261.6,329.6,392,523.2];const i=(Math.floor(time/1.5)%tones.length);
    this.note(tones[i],.9,.008,'sine');
  }
}
