// FrameBuffer.cpp
//

#include "FrameBuffer.h"
#define LZZ_INLINE inline
using namespace std;
bool const FORCE_SQUARE_FRAMEBUFFER = true;
Vector2::Vector2 (int _x, int _y)
                         {
    x = _x;
    y = _y;
  }
Vector2::Vector2 (int (a) [2])
                   {
    x = a[0];
    y = a[1];
  }
Vector2::Vector2 ()
           {}
Vector2 operator + (Vector2 a, Vector2 b)
                                       {
  Vector2 r;
  r.x = a.x+b.x;
  r.y = a.y+b.y;
  return r;
}
void gotoxy (int x, int y)
                        {
  printf("%c[%d;%df",0x1B,y,x);
}
uint8_t parseColor (uint8_t c)
                             {
  uint8_t r = 0;
  r = (c&0b1000)?90:30;
  c =  c&0b0111;
  r += c;
  return r;
}
void setColor (uint8_t c)
                        {
  uint8_t f = parseColor(c&0xf);
  uint8_t b = parseColor((c&0xf0)>>4)+10;
  printf("%c[%d;%dm",0x1B,unsigned(f),unsigned(b) );
}
Vector2 GetConsoleSize ()
                        {
  struct winsize size;
  ioctl(0,TIOCGWINSZ,&size);
  return Vector2(size.ws_col,size.ws_row);
}
void FrameBuffer::resize (int x, int y)
                          {
    if(FORCE_SQUARE_FRAMEBUFFER){
      x = y = min(x,y);
    }
    w = x;
    h = y;
    w1 = (int)ceil(x*3.0/2.0);
    len = w1*y;
    delete arr;
    delete bits;
    arr = new uint8_t[len];
    bits = new bool[len];
  }
FrameBuffer::FrameBuffer (int x, int y)
                          {
    arr = NULL;
    bits = NULL;
    size = GetConsoleSize();
    offset = Vector2(0,0);
    resize(x,y);
  }
void FrameBuffer::randomize ()
                  {
    for (int i = 0; i < len; i++){
      arr[i] = rand()&0xff;
      bits[i] = true;
    }
  }
void FrameBuffer::forceRedraw (bool force)
                                    {
    for (int i = 0; i < len; i++){
      if(force||arr[i])bits[i] = true;
    }
  }
void FrameBuffer::draw (bool fast)
                            {
    uint8_t prevc = arr[0];
    int prevposx = -1;
    int prevposy = -1;  
    setColor(prevc);
    if(fast)gotoxy(-offset.x+1,-offset.y+1);
    for (int j = max(offset.y,0); j < h; j++){
      if(j>size.y+offset.y)break;
      for (int i = max(offset.x,0); i < w1; i++){
        int index = i+j*w1;
        if(i<size.x+offset.x&&index<len&&bits[index] == true){
          bits[index] = false;
          if( (prevposx+1!=i||prevposy!=j)&&!fast ){
            prevposx = i;
            prevposy = j;
            gotoxy(i+1-offset.x,j+1-offset.y);
          }
          if(prevc!=arr[index]){
            setColor(arr[index]);
            prevc = arr[index];
          }
          cout<<"\u258C";//"\xdd";
        }
      }
      if(fast)gotoxy(-offset.x+1,j-offset.y+1);
    }
    gotoxy(1,1);
  }
void FrameBuffer::_setPixel (int x, int y, uint8_t c)
                                       {
    c = c&0xf;
    //x = x%w;
    //y = y%h;
    int offset = x%2;
    int pos = x/2;
    int index = pos+y*w1;
    if(index>=len)throw "overflow";
    uint8_t r;
    if(!offset){
      r = arr[index]&0xf0;
      r = r|c;
    }else{
      r = arr[index]&0x0f;
      r = r|(c<<4);
    }
    if(arr[index] != r)bits[index] = true;
    arr[index] = r;
  }
void FrameBuffer::setPixel (int x, int y, uint8_t c)
                                      {
    _setPixel(x*3,y,c);
    _setPixel(x*3+1,y,c);
    _setPixel(x*3+2,y,c);
  }
void FrameBuffer::fill (uint8_t c)
                      {
    c = c&0xf;
    uint8_t v = c|(c<<4);
    for (int i = 0; i < len; i++){
      arr[i] = v;
      bits[i] = true;
    }
  }
void FrameBuffer::checkerboard (uint8_t a, uint8_t b)
                                        {
    a = a&0xf;
    b = b&0xf;
    uint8_t v = a|(b<<4);
    uint8_t u = b|(a<<4);
    for (int i = 0; i < len; i++){
      arr[i] = (i/w1)%2?u:v;
      bits[i] = true;
    }
  }
int FrameBuffer::getW () const
                 {return w;}
int FrameBuffer::getH () const
                 {return h;}
#undef LZZ_INLINE
