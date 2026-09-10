import AppKit
import Foundation
let destination = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "public")
let iconset = destination.appendingPathComponent("HyperHinge.iconset")
try FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)
for pixels in [16,32,64,128,256,512,1024] {
 let image = NSImage(size: NSSize(width:pixels,height:pixels))
 image.lockFocus()
 let ctx=NSGraphicsContext.current!.cgContext
 ctx.scaleBy(x:CGFloat(pixels)/1024,y:CGFloat(pixels)/1024)
 NSColor(calibratedWhite:0.065,alpha:1).setFill()
 NSBezierPath(roundedRect:NSRect(x:32,y:32,width:960,height:960),xRadius:215,yRadius:215).fill()
 NSColor(calibratedWhite:0.94,alpha:1).setStroke()
 let base=NSBezierPath();base.lineWidth=35;base.lineCapStyle = .round;base.move(to:NSPoint(x:245,y:310));base.line(to:NSPoint(x:800,y:310));base.stroke()
 let lid=NSBezierPath();lid.lineWidth=42;lid.lineCapStyle = .round;lid.move(to:NSPoint(x:263,y:335));lid.line(to:NSPoint(x:590,y:790));lid.stroke()
 let pivot=NSBezierPath(ovalIn:NSRect(x:207,y:270,width:100,height:100));pivot.lineWidth=25;pivot.stroke()
 NSColor(calibratedRed:0.898,green:0.137,blue:0.180,alpha:1).setStroke()
 let angle=NSBezierPath();angle.lineWidth=24;angle.lineCapStyle = .round;angle.appendArc(withCenter:NSPoint(x:257,y:320),radius:265,startAngle:8,endAngle:51);angle.stroke()
 image.unlockFocus()
 let bitmap=NSBitmapImageRep(data:image.tiffRepresentation!)!
 let data=bitmap.representation(using:.png,properties:[:])!
 if pixels == 1024 {try data.write(to:destination.appendingPathComponent("hyperhinge.png"))}
 if pixels<=512 {try data.write(to:iconset.appendingPathComponent("icon_\(pixels)x\(pixels).png"))}
 if pixels>=32 {let half=pixels/2;try data.write(to:iconset.appendingPathComponent("icon_\(half)x\(half)@2x.png"))}
}
