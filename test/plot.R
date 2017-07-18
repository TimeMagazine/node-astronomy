AU <- 149597870.7
RADIUS_SUN <- 695700

mercury = read.csv("Mercury.csv")
#venus = read.csv(paste(PATH, "test/venus.csv", sep=""))
earth = read.csv("Earth.csv")
#mars = read.csv(paste(PATH, "test/mars.csv", sep=""))
#halley = read.csv(paste(PATH, "test/halley.csv", sep=""))

#png(paste(PATH, "test/inner_solar_system.png", sep=""))
plot(0, 0, type="p", col="yellow", pch=16, cex=2, xlim=c(-AU * 1.2, AU * 1.2), ylim=c(-AU * 1.2, AU * 1.2), xaxt='n', yaxt='n', ann=FALSE)
#lines(mars$x, mars$y, type="l", col="red")
lines(mercury$x, mercury$y, type="l", col="orange")
#lines(venus$x, venus $y, type="l", col="green")
lines(earth$x, earth$y, type="l", col="blue")
#lines(halley$x, halley$y, type="l", col="gray")

#dev.off()

?plot
