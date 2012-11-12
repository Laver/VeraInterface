/**************************
* Application
**************************/
var App = Ember.Application.create({
    
    Router : Ember.Router.extend({
        root: Ember.Route.extend({
            index: Ember.Route.extend({
                route: '/'
            }),
            scenes:  Ember.Route.extend({
                route: '/scenes',
                connectOutlets:  function(router, context){
                  router.get('applicationController').connectOutlet('sceneList', App.Scenes.allSorted());
                },
                enter: function ( router ){
                  //
                },
                runScene : function( router, event ){
                    var scene = event.context;
                    router.get('sceneListController').runScene(scene);
                }
            }),
            rooms:  Ember.Route.extend({
                route: '/rooms',
                connectOutlets:  function(router, context){
                  router.get('applicationController').connectOutlet('roomList', App.Rooms.all());
                },
                enter: function ( router ){
                  //
                }
            }),
            devices:  Ember.Route.extend({
                route: '/devices',
                connectOutlets:  function(router, context){
                  router.get('applicationController').connectOutlet('deviceList', App.Devices.all());
                },
                enter: function ( router ){
                  //
                }
            }),
            
            listScenes : Ember.Route.transitionTo("scenes"),
            listRooms : Ember.Route.transitionTo("rooms"),
            listDevices : Ember.Route.transitionTo("devices"),
            reloadData : function (router) {
                router.get('applicationController').reloadData();
            }
        })
    }),
    
    /**************************
    * Views & Controllers
    **************************/
    
    ApplicationView : Em.View.extend({
      templateName: 'application'
    }),
    
    SceneListView : Em.View.extend({
      templateName: 'scene-list'
    }),
    SceneListController: Em.ArrayController.extend({
        
        // Method to execute a specific scene
        runScene : function ( scene ) {
            console.log("RunScene", scene.id, scene.name);
        }
        
    }),
    
    RoomListView : Em.View.extend({
      templateName: 'room-list'
    }),
    RoomListController: Em.ArrayController.extend(),
    
    DeviceListView : Em.View.extend({
        templateName : 'device-list'
    }),
    DeviceListView2 : Em.CollectionView.extend({
  
        itemViewClass: this.DefaultView,
        
        createChildView: function(view, attrs) {
            console.log("createChildView",view, attrs);
            switch (attrs.content.device_view) {
                case "DeviceSwitchView":
                   view = App.DeviceSwitchView;
                   break;
                case "DeviceDimmableLightView": 
                   view = App.DeviceDimmableLightView;
                   break;              
            }
            
            return this._super(view, attrs);
        },
        content:['b']
    }),
    
    
    DeviceListController: Em.ArrayController.extend({
        
        setDeviceTarget : function ( device, newTarget ){
            console.log("setDeviceTarget", device, newTarget);
        },
        getDeviceView : function ( device ) {
            console.log(device);
            return DeviceSwitchView;
        }
        
    }),
    
    DefaultView : Ember.View.extend({
        template: function (context) {
            debugger;
            switch (context.content.device_view) {
                case "DeviceSwitchView":
                   return App.DeviceSwitchView;
                   break;
                case "DeviceDimmableLightView": 
                   return App.DeviceDimmableLightView;
                   break;              
            }
        }
    }),
    
    DeviceSwitchView : Em.View.extend({
        templateName: "device-switch"
    }),
    
    DeviceDimmableLightView : Em.View.extend({
        templateName: "device-dimmablelight"
    }),
    
    DeviceController: Em.ArrayController.extend({
        
        setDeviceTarget : function ( device, newTarget ){
            console.log("setDeviceTarget", device, newTarget);
        }
        
    }),
    
    
    
    ApplicationController : Em.ObjectController.extend({
        
        statusUrl:"data/lu_status2.json",
        dataUrl:"data/user_data2.json",
        status : "Ready",
        
        loadStatus : function () {
         
            var me = this;
            var url = me.get("statusUrl");
            me.set("status", "Loading..." + url);
            
            $.getJSON(url, function(data){
                $(data).each(function(index,value){
                    console.log(index, value);
                    //me.pushObject(t);
                });
            });
        },
        loadData : function () {
            var me = this;
            var url = me.get("dataUrl");
            me.set("status", "Loading..." + url);
            
            $.getJSON(url, function(data){
                console.log(data);
                App.Rooms.initRooms(data.rooms);
                App.Devices.initDevices(data.devices);
                App.Scenes.initScenes(data.scenes);
                me.set("status", "Complete. Rooms:"+ App.Rooms.all().get("length") +" Devices:" + App.Devices.all().get("length") );
            });
        },
        reloadData : function () {
            console.log("ReloadData!");
            this.loadData();
        }
        
    }),
    
    ready : function(){
        App.get('router.applicationController').loadData();
    }
    
});


/**************************
* Models
**************************/

App.Scene = Em.Object.extend ({
    id: null,
    name: null,
    room: null
});
App.Room = Em.Object.extend ({
    id: null,
    name: null,
    devices: []
});
 
App.Device = Em.Object.extend ({
    
    id: null,
    name: null,
    device_type: null,
    room_id: null,
    room: null,
    service_id: null,
    device_view: null,
    /*room: function(key, value) {
        // getter
        if (arguments.length === 1) {
          return _room;
        // setter
        } else {
            if (typeof value == "string" || typeof value == "number") {
                App.roomController.findProperty("id", device.room_id).devices.pushObject(device);
            } else {
            }
          var name = value.split(" ");
          this.set('firstName', name[0]);
          this.set('lastName', name[1]);
          return value;
        }*/
    status: null,
    states: [],
    isOn: function () { return (this.status == "1"); }.property("status"),
    
    SetTarget : function ( newVal ) {
        var request = "/data_request?id=action&DeviceNum=" + this.id;
        request += "&serviceId=" + this.service_id;
        request += "&action=SetTarget&newTargetValue=" + newVal;
    }
});

App.Switch = App.Device.extend ({
    
    device_view : "DeviceSwitchView",
    setStates: function ( statesArray ) {
        this.states = statesArray;
        this.status = statesArray.findProperty("variable", "Status").value;
    }
    
});
App.DimmableLight = App.Device.extend ({

    device_view : "DeviceDimmableLightView",
    currentLevel: null,
    targetLevel: null,
    isAtTarget: function () { return (this.currentLevel == this.targetLevel); },
    setStates: function ( statesArray ) {
        this.states = statesArray;
        this.status = statesArray.findProperty("variable", "Status").value;
        this.currentLevel = statesArray.findProperty("variable", "LoadLevelStatus").value;
        this.targetLevel = statesArray.findProperty("variable", "LoadLevelTarget").value;
    }
    
});

App.DeviceTypeEnum = {
    
    "urn:schemas-upnp-org:device:DimmableLight:1" : App.DimmableLight,
    "urn:schemas-upnp-org:device:BinaryLight:1" : App.Switch

};

App.Scenes = Ember.Object.extend();
App.Scenes.reopenClass({
  _listOfScenes:  Em.A(),
  _sortedScenes:  Em.A(),
  all:  function(){
    var allScenes = this._listOfScenes;
    
    // AJAX call would go here to populate as required
    
    return this._listOfScenes;
  },
  allSorted : function (){
      return this._sortedScenes;
  },
  find:  function(id){
    return this._listOfScenes.findProperty('id', id);
  },
  initScenes : function ( sceneArray ) {
        console.log("initScenes");
        var ds = this._listOfScenes;
        // clear the scene list
        ds.clear();
        // loop through the passed array and create new room items
        sceneArray.forEach(function (item){
            
            // only add a scene if it has a "groups" property, as these should not be triggered scenes
            if (item.groups){
                var newScene = App.Scene.create( { name : item.name , id : item.id, room : item.room } );
                ds.pushObject(newScene);
            }
        });
        var sorted =  ds.sort(function(a,b) {
            return a.get('room') - b.get('room');
        });
        var sc = this._sortedScenes;
        sc.clear();
        sorted.forEach (function (item) {
            sc.pushObject(item);
        });
        
    }
});


App.Rooms = Ember.Object.extend();
App.Rooms.reopenClass({
  _listOfRooms:  Em.A(),
  all:  function(){
    var allRooms = this._listOfRooms;
    
    // AJAX call would go here to populate as required
    
    return this._listOfRooms;
  },
  find:  function(id){
    return this._listOfRooms.findProperty('id', id);
  },
  initRooms : function ( roomArray ) {
        console.log("initRooms");
        var ds = this._listOfRooms;
        // clear the rooms list
        ds.clear();
        // loop through the passed array and create new room items
        roomArray.forEach(function (item){
            var newRoom = App.Room.create( { name : item.name , id : item.id } );
            ds.pushObject(newRoom);
        });
    }
});


App.Devices = Ember.Object.extend();
App.Devices.reopenClass({
  _listOfDevices:  Em.A(),
  all:  function(){
    var allDevices = this._listOfDevices;
    
    // AJAX call would go here to populate as required
    
    return this._listOfDevices;
  },
  find:  function(id){
    return this._listOfDevices.findProperty('id', id);
  },
  initDevices : function ( data ) {
        console.log("initDevices");
        var ds = this._listOfDevices;
        // clear the rooms list
        ds.clear();
        // loop through the passed array and create new Device items
        data.forEach(function (item){
            
            // use the DeviceTypeEnum to dynamically decied which Device class 
            // should be instanciated
            var deviceClass = App.DeviceTypeEnum[item.device_type];
            
            // if the device is in the enum, then we have a class to build, 
            // otherwise we should skip it
            if (deviceClass)
            {
                var device = deviceClass.create( {
                        name : item.name , 
                        id : item.id, 
                        room_id : item.room,
                        service_id : item.serviceId,
                        device_type : item.device_type
                    });
                device.setStates(item.states);
                ds.pushObject(device);
            }
        });
    }
});

Ember.Handlebars.registerHelper('deviceView', function() {
    //debugger;
    /*
    var viewname = App.DeviceDimmableLightView.get('className');
    console.log(this.device_view, App.DeviceDimmableLightView.get('className'));
    switch (this.device_view)
    {
        case App.DeviceSwitchView.get('className'):
            return new Handlebars.SafeString("TEST" + App.DeviceSwitchView.get('className'));
        case App.DeviceDimmableLightView.get('className'):
            return new Handlebars.SafeString("TEST" + App.DeviceDimmableLightView.get('className'));
    }
    */
    
    //return new Handlebars.SafeString("TEST" + this.device_view);
});


App.initialize();