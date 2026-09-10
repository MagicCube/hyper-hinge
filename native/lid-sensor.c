// Read-only Apple HID lid angle probe. No root privileges or system changes.
#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/hid/IOHIDManager.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
static volatile sig_atomic_t running = 1;
static void stop(int s) { (void)s; running = 0; }
static void number(CFMutableDictionaryRef d, CFStringRef key, int value) {
  CFNumberRef n = CFNumberCreate(NULL, kCFNumberIntType, &value);
  CFDictionarySetValue(d, key, n); CFRelease(n);
}
static int read_angle(IOHIDDeviceRef device) {
  uint8_t bytes[16] = {0}; CFIndex length = sizeof(bytes);
  IOReturn r = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 1, bytes, &length);
  if (r != kIOReturnSuccess || length < 3 || bytes[0] != 1) return -1;
  int angle = bytes[1] | (bytes[2] << 8);
  return angle <= 180 ? angle : -1;
}
int main(int argc, char **argv) {
  bool once = argc > 1 && strcmp(argv[1], "--once") == 0;
  signal(SIGINT, stop); signal(SIGTERM, stop); setvbuf(stdout, NULL, _IOLBF, 0);
  IOHIDManagerRef manager = IOHIDManagerCreate(NULL, kIOHIDOptionsTypeNone);
  CFMutableDictionaryRef match = CFDictionaryCreateMutable(NULL, 3, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
  number(match, CFSTR(kIOHIDVendorIDKey), 0x05ac);
  number(match, CFSTR(kIOHIDDeviceUsagePageKey), 0x20);
  number(match, CFSTR(kIOHIDDeviceUsageKey), 0x8a);
  IOHIDManagerSetDeviceMatching(manager, match); CFRelease(match);
  IOHIDManagerOpen(manager, kIOHIDOptionsTypeNone);
  CFSetRef devices = IOHIDManagerCopyDevices(manager);
  IOHIDDeviceRef selected = NULL;
  if (devices) {
    CFIndex count = CFSetGetCount(devices);
    const void **all = calloc((size_t)count, sizeof(void*));
    if (all) {
      CFSetGetValues(devices, all);
      for (CFIndex i = 0; i < count; i++) {
        IOHIDDeviceRef device = (IOHIDDeviceRef)all[i];
        if (IOHIDDeviceOpen(device, kIOHIDOptionsTypeNone) != kIOReturnSuccess) continue;
        if (read_angle(device) >= 0) { selected = (IOHIDDeviceRef)CFRetain(device); break; }
        IOHIDDeviceClose(device, kIOHIDOptionsTypeNone);
      }
      free(all);
    }
    CFRelease(devices);
  }
  int result = 0;
  if (!selected) { puts("{\"error\":\"No readable lid angle sensor found\"}"); result = 2; }
  else {
    while (running) {
      int angle = read_angle(selected);
      if (angle < 0) { puts("{\"error\":\"Sensor read failed\"}"); result = 3; break; }
      printf("{\"angle\":%d}\n", angle);
      if (once) break;
      usleep(20000); // Request 50 Hz; hardware resolution/update rate may differ.
    }
    IOHIDDeviceClose(selected, kIOHIDOptionsTypeNone); CFRelease(selected);
  }
  IOHIDManagerClose(manager, kIOHIDOptionsTypeNone); CFRelease(manager);
  return result;
}
