# The Mobile Ads and UMP SDKs ship their own consumer rules.
# The SDK pulls in WorkManager 2.7, whose Room 2.2 rule keeps RoomDatabase subclasses but not
# their constructors. R8 full mode (AGP 9) then strips WorkDatabase_Impl's constructor, which
# Room calls by reflection, and the app crashes at launch.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
