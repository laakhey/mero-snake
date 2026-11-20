"""Synthesises the game's retro sound effects into assets/sounds (stdlib only)."""
import math, os, struct, wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')

def tone(freq, ms, vol=0.35, shape='square', slide=0.0):
    n = int(RATE * ms / 1000)
    out = []
    phase = 0.0
    for i in range(n):
        f = freq + slide * (i / n)
        phase += f / RATE
        p = phase % 1.0
        if shape == 'square':
            s = 1.0 if p < 0.5 else -1.0
        elif shape == 'tri':
            s = 4 * abs(p - 0.5) - 1
        else:
            s = math.sin(2 * math.pi * p)
        env = min(1.0, i / (RATE * 0.004)) * (1 - i / n) ** 1.5
        out.append(s * vol * env)
    return out

def write(name, samples):
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32767)) for s in samples))

os.makedirs(OUT, exist_ok=True)
write('eat.wav', tone(660, 45) + tone(990, 60))
write('bonus.wav', tone(784, 50) + tone(988, 50) + tone(1175, 50) + tone(1568, 110))
write('bonus-spawn.wav', tone(1320, 40, 0.2, 'tri') + tone(1760, 60, 0.2, 'tri'))
write('die.wav', tone(440, 120, 0.4, 'square', -200) + tone(220, 260, 0.4, 'square', -140))
write('turn.wav', tone(1200, 18, 0.12, 'tri'))
write('click.wav', tone(880, 25, 0.2, 'tri'))
write('count.wav', tone(660, 90, 0.25, 'sine'))
write('go.wav', tone(1320, 160, 0.3, 'sine'))
write('win.wav', sum((tone(f, 110) for f in (523, 659, 784, 1047, 784, 1047)), []))
