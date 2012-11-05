


/**************************
* Application
**************************/
var App = Ember.Application.create();

App.Router = Ember.Router.extend({
  root: Ember.Route.extend({
    index: Ember.Route.extend({
      route: '/'
    })
  })
})

App.initialize();
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
    room: null,
    status: null,
    states: [],
    isOn: function () { return (this.status == "1") }.property("status"),
    
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
* Views
**************************/

App.ApplicationView = Em.View.extend({
  templateName: 'application'
});
/**************************
* Controllers
**************************/

App.mainController = Em.ObjectController.create({
    statusUrl:"data/lu_status2.json",
    dataUrl:"data/user_data2.json",
    status : "Ready",
    veradata : {},
    verastatus : {},
    loadStatus : function () {
     
        var me = this;
        var url = me.get("statusUrl");
        me.set("status", "Loading..." + url);
        
        $.getJSON(url, function(data){
            me.set('verastatus', []);
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
            me.set('veradata', []);
            $(data).each(function(index,value){
                console.log(index, value);
                //me.pushObject(t);
            });
            App.roomController.initRooms(data.rooms);
            App.deviceController.initDevices(data.devices);
        });
    }
    
});

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
        
        console.log("Rooms:", me.get("length"), me.content)
    }
    
});

App.deviceController = Em.ArrayController.create({
    content : [],
    initDevices : function ( deviceArray ) {
        var me = this;
        // clear the device list
        me.set("content",[]);
        // loop through the passed array and create new room items
        deviceArray.forEach(function (item){
            var newDevice = App.Device.create( { 
                    name : item.name , 
                    id : item.id, 
                    room : item.room,
                    device_type : item.device_type
                });
            
            var deviceClass = App.DeviceTypeEnum[item.device_type];
            
            // if the device is in the enum, then we have a class to build, 
            // otherwise we should skip it
            if (deviceClass)
            {
                var testDevice = deviceClass.create( {
                        name : item.name , 
                        id : item.id, 
                        room : item.room,
                        device_type : item.device_type
                    });
                testDevice.setStates(item.states)
                me.pushObject(testDevice);
            }
        });
        
        console.log("Devices:", me.get("length"), me.content)
    }
    
});

App.ApplicationController = App.mainController;