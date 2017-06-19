"use strict";

// TextMetrics.js
// By Don Hopkins (dhopkins@donhopkins.com)
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function() {

    var webPageURL = "TextMetricsPage.html"; // URL of tablet web page.
    var randomizeWebPageURL = true; // Set to true for debugging.
    var lastWebPageURL = ""; // Last random URL of tablet web page.
    var onTextMetricsPage = false; // True when text web page is opened.
    var webHandlerConnected = false; // True when the web handler has been connected.
    var channelName = "TextMetrics"; // Unique name for channel that we listen to.
    var tabletButtonName = "TEXT"; // Tablet button label.
    var tabletButtonIcon = "icons/tablet-icons/menu-i.svg"; // Icon for text button.
    var tabletButtonActiveIcon = "icons/tablet-icons/menu-a.svg"; // Active icon for text button.
    var tabletButton = null; // The button we create in the tablet.
    var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system"); // The awesome tablet.

    function onTextMetricsMessageReceived(channel, message, senderID) {

        // Ignore messages to any other channel than mine.
        if (channel != channelName) {
            return;
        }

        // Parse the message and pull out the message parameters.
        var messageData = JSON.parse(message);
        var messageType = messageData.type;

        //print("MESSAGE", message);
        //print("MESSAGEDATA", messageData, JSON.stringify(messageData));

        switch (messageType) {

            default:
                print("onTextMetricsMessageReceived: unknown messageType", messageType, "message", message);
                break;

        }

    }

    // Show the tablet web page and connect the web handler.
    function showTabletWebPage() {
        var url = Script.resolvePath(webPageURL);
        if (randomizeWebPageURL) {
            url += '?rand=' + Math.random();
        }
        lastWebPageURL = url;
        onTextMetricsPage = true;
        tablet.gotoWebScreen(lastWebPageURL);
        // Connect immediately so we don't miss anything.
        connectWebHandler();
    }

    function updateTextMetricsPage() {
    }

    function destroyTextMetricsObjects() {
    }

    // Handle events from the tablet web page.
    function onWebEventReceived(event) {
        if (!onTextMetricsPage) {
            return;
        }

        //print("onWebEventReceived: event", event);

        var eventData = JSON.parse(event);
        var eventType = eventData.type;

        switch (eventType) {

            case 'Ready':
                updateTextMetricsPage();
                break;

            case 'Update':
                updateTextMetricsPage();
                break;

            default:
                print("onWebEventReceived: unexpected eventType", eventType);
                break;

        }
    }

    function onScreenChanged(type, url) {
        //print("onScreenChanged", "type", type, "url", url, "lastWebPageURL", lastWebPageURL);
    
        if ((type === "Web") && 
            (url === lastWebPageURL)) {
            if (!onTextMetricsPage) {
                onTextMetricsPage = true;
                connectWebHandler();
            }
        } else { 
            if (onTextMetricsPage) {
                onTextMetricsPage = false;
                disconnectWebHandler();
            }
        }

    }

    function connectWebHandler() {
        if (webHandlerConnected) {
            return;
        }

        try {
            tablet.webEventReceived.connect(onWebEventReceived);
        } catch (e) {
            print("connectWebHandler: error connecting: " + e);
            return;
        }

        webHandlerConnected = true;
        //print("connectWebHandler connected");

        updateTextMetricsPage();
    }

    function disconnectWebHandler() {
        if (!webHandlerConnected) {
            return;
        }

        try {
            tablet.webEventReceived.disconnect(onWebEventReceived);
        } catch (e) {
            print("disconnectWebHandler: error disconnecting web handler: " + e);
            return;
        }
        webHandlerConnected = false;

        //print("disconnectWebHandler: disconnected");
    }

    // Show the tablet web page when the text button on the tablet is clicked.
    function onTabletButtonClicked() {
        showTabletWebPage();
    }

    // Shut down the text application when the tablet button is destroyed.
    function onTabletButtonDestroyed() {
        shutDown();
    }

    // Start up the text application.
    function startUp() {
        //print("startUp");

        tabletButton = tablet.addButton({
            icon: tabletButtonIcon,
            activeIcon: tabletButtonActiveIcon,
            text: tabletButtonName,
            sortOrder: 0
        });

        Messages.subscribe(channelName);

        tablet.screenChanged.connect(onScreenChanged);

        Messages.messageReceived.connect(onTextMetricsMessageReceived);

        tabletButton.clicked.connect(onTabletButtonClicked);

        Script.scriptEnding.connect(onTabletButtonDestroyed);

        //print("Added text button to tablet.");
    }

    // Shut down the text application.
    function shutDown() {
        //print("shutDown");

        disconnectWebHandler();

        destroyTextMetricsObjects();

        if (onTextMetricsPage) {
            tablet.gotoHomeScreen();
            onTextMetricsPage = false;
        }

        tablet.screenChanged.disconnect(onScreenChanged);

        Messages.messageReceived.disconnect(onTextMetricsMessageReceived);

        // Clean up the tablet button we made.
        tabletButton.clicked.disconnect(onTabletButtonClicked);
        tablet.removeButton(tabletButton);
        tabletButton = null;

        //print("Removed text button from tablet.");
    }

    // Kick off the text application!
    startUp();

}());
