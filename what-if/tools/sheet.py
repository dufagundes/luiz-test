# contact sheet: python tools/sheet.py <dir> <out.png> [cols]
import glob, sys, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(glob.glob(os.path.join(d, '*-*.png')), key=lambda f: float(f.rsplit('-', 1)[1][:-4]))
ims = [Image.open(f).resize((270, 480)) for f in fs]
rows = (len(ims) + cols - 1) // cols
o = Image.new('RGB', (270 * cols, 480 * rows), 'black')
for i, im in enumerate(ims):
    o.paste(im, ((i % cols) * 270, (i // cols) * 480))
o.save(out)
print(len(ims), [os.path.basename(f) for f in fs])
