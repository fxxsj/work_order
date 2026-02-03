---
wave: 1
depends_on: []
files_modified:
  - frontend/src/utils/mobile.js
autonomous: true
---

<plan>
  <goal>Fix event listener memory leaks by adding proper cleanup for all addEventListener calls</goal>

  <task type="auto">
    <name>Add cleanup for touch event listeners in GestureUtils</name>
    <files>frontend/src/utils/mobile.js</files>
    <action>Modify addSwipeListener and addLongPressListener functions to return cleanup functions. Store references to event handlers and provide a way to remove them. Return a cleanup function from each listener method.</action>
    <verify>grep -c "addEventListener" frontend/src/utils/mobile.js</verify>
    <done>All touch event listeners have cleanup mechanism</done>
  </task>

  <task type="auto">
    <name>Add cleanup for online/offline listeners in NetworkUtils</name>
    <files>frontend/src/utils/mobile.js</files>
    <action>The onNetworkChange function already returns a cleanup function, but verify it properly removes both 'online' and 'offline' event listeners. The current implementation looks correct but should be tested.</action>
    <verify>grep -A5 "onNetworkChange" frontend/src/utils/mobile.js | grep -c "removeEventListener"</verify>
    <done>NetworkUtils cleanup verified</done>
  </task>

  <task type="auto">
    <name>Add cleanup for beforeinstallprompt listener in PWAUtils</name>
    <files>frontend/src/utils/mobile.js</files>
    <action>The checkInstallPrompt function adds a 'beforeinstallprompt' event listener but has no cleanup mechanism. Modify it to return a cleanup function that removes the event listener.</action>
    <verify>grep -A10 "checkInstallPrompt" frontend/src/utils/mobile.js | grep -c "removeEventListener\|cleanup"</verify>
    <done>PWAUtils has proper cleanup for beforeinstallprompt listener</done>
  </task>

  <task type="auto">
    <name>Verify MobileMixin cleanup is complete</name>
    <files>frontend/src/utils/mobile.js</files>
    <action>Verify MobileMixin's beforeDestroy hook properly cleans up all event listeners. The resizeCleanup from ResponsiveUtils.onResize is already handled, but verify no other listeners are attached.</action>
    <verify>grep -B5 -A10 "beforeDestroy" frontend/src/utils/mobile.js</verify>
    <done>MobileMixin properly cleans up all listeners in beforeDestroy</done>
  </task>

  <task type="auto">
    <name>Document cleanup pattern for mobile.js</name>
  <files>frontend/src/utils/mobile.js</files>
    <action>Add JSDoc comments documenting the cleanup pattern for each utility function that adds event listeners. This helps future developers understand how to properly clean up.</action>
    <verify>grep -c "@returns" frontend/src/utils/mobile.js</verify>
    <done>All event listener functions have documented cleanup patterns</done>
  </task>
</plan>

<verification>
  <criteria>
    - All addEventListener calls have corresponding removeEventListener
    - All cleanup functions are called in proper lifecycle hooks
    - No memory leaks from event listeners
    - Mobile utility functions work correctly after cleanup
  </criteria>
</verification>

<must_haves>
  truths:
    - "Event listeners properly cleaned up"
    - "No memory leaks from event listeners"
    - "All addEventListener calls have corresponding removeEventListener"
  artifacts:
    - path: "frontend/src/utils/mobile.js"
      provides: "GestureUtils with cleanup functions"
    - path: "frontend/src/utils/mobile.js"
      provides: "PWAUtils with beforeinstallprompt cleanup"
    - path: "frontend/src/utils/mobile.js"
      provides: "NetworkUtils with verified cleanup"
</must_haves>
