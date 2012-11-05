/**************************
* Application
**************************/
var App = Ember.Application.create({
    
    Router : Ember.Router.extend({
        root: Ember.Route.extend({
            index: Ember.Route.extend({
              route: '/'
            }),
            rooms:  Ember.Route.extend({
                route: '/rooms',
                connectOutlets:  function(router, context){
                  router.get('applicationController').connectOutlet('roomList');
                },
                index: Ember.Route.extend({
                  route: '/'
                }),
                enter: function ( router ){
                  //
                }
            }),
            devices:  Ember.Route.extend({
                route: '/devices',
                connectOutlets:  function(router, context){
                  router.get('applicationController').connectOutlet('deviceList');
                },
                index: Ember.Route.extend({
                  route: '/'
                }),
                enter: function ( router ){
                  //
                }
            })
        })
    }),
    
    /**************************
    * Views
    **************************/
    
    ApplicationView : Em.View.extend({
      templateName: 'application'
    }),
    
    RoomListView : Em.View.extend({
      templateName: 'room-list'
    }),

    RoomListController: Em.Controller.extend(),
    
    DeviceListView : Em.View.extend({
      templateName: 'device-list'
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
                })
            })
        },
        loadData : function () {
            var me = this;
            var url = me.get("dataUrl");
            me.set("status", "Loading..." + url);
            
            $.getJSON(url, function(data){
                App.roomController.initRooms(data.rooms);
                App.deviceController.initDevices(data.devices);
                me.set("status", "Complete. Rooms:"+ App.roomController.get("length") +" Devices:" + App.deviceController.get("length") );
            });
        },
        listRooms : function(){
            App.get("router").transitionTo("rooms");
        },
        listDevices : function(){
            App.get("router").transitionTo("devices");
        }
        
    }),
    
    //ApplicationController : this.mainController,
    
    
    ready : function(){
        //App.mainController = App.MainController.create();
        App.get('router.applicationController').loadData();
    }
    
});


/**************************
* Models
**************************/

App.Person = Em.Object.extend({
  firstName: null,
  lastName: null,
  fullName: function() {
    return this.get('firstName') +
           " " + this.get('lastName');
  }.property('firstName', 'lastName')
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
    
});

App.Switch = App.Device.extend ({
    
    status: null,
    setStates: function ( statesArray ) {
        this.states = statesArray;
        this.status = statesArray.findProperty("variable", "Status").value;
    }
    
});
App.DimmableLight = App.Device.extend ({
    
    status: null,
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


/**************************
* Controllers
**************************/
/*
App.mainController = Em.ObjectController.create({
    
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
            })
        })
    },
    loadData : function () {
     
        var me = this;
        var url = me.get("dataUrl");
        me.set("status", "Loading..." + url);
        
        $.getJSON(url, function(data){
            App.roomController.initRooms(data.rooms);
            App.deviceController.initDevices(data.devices);
            me.set("status", "Complete. Rooms:"+ App.roomController.get("length") +" Devices:" + App.deviceController.get("length") );
        });
    },
    listRooms : function(){
        App.RoomListView.appendTo("#content");
    },
    listDevices : function(){
        //App.DeviceListView.appendTo("#content");
    }
    
});
*/
App.roomController = Em.ArrayController.create({
    
    content : [],
    initRooms : function ( roomArray ) {
        var me = this;
        // clear the rooms list
        me.set("content",[]);
        // loop through the passed array and create new room items
        roomArray.forEach(function (item){
            var newRoom = App.Room.create( { name : item.name , id : item.id } );
            me.pushObject(newRoom);
        });
    },
    findById : function ( id ) {
        return this.findProperty("id", id);
    },
    all: [1,2,3]
    
});


App.deviceController = Em.ArrayController.create({
    content : [],
    initDevices : function ( deviceArray ) {
        var me = this;
        // clear the device list
        me.set("content",[]);
        // loop through the passed array and create new room items
        deviceArray.forEach(function (item){
            
            // use the DeviceTypeEnum to dynamically decied which Device class 
            // should be instanciated
            var deviceClass = App.DeviceTypeEnum[item.device_type];
            
            // if the device is in the enum, then we have a class to build, 
            // otherwise we should skip it
            if (deviceClass)
            {
                var testDevice = deviceClass.create( {
                        name : item.name , 
                        id : item.id, 
                        room_id : item.room,
                        device_type : item.device_type
                    });
                testDevice.setStates(item.states)
                me.pushObject(testDevice);
            }
        });
    },
    findById : function ( id ) {
        return this.findProperty("id", id);
    }
    
});




App.initialize();


