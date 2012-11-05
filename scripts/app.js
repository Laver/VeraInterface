


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

/**************************
* Views
**************************/

App.ApplicationView = Em.View.extend({
  templateName: 'application'
});
/**************************
* Controllers
**************************/

App.mainController = Em.ArrayController.create({
    url:"data/lu_status2.json",
    status : "Ready",
    veradata : [],
    loadData : function () {
     
        var me = this;
        var url = me.get("url");
        me.set("status", "Loading..." + url);
        
        $.getJSON(url, function(data){
            me.set('veradata', []);
            $(data).each(function(index,value){
                console.log(index, value);
                //me.pushObject(t);
            })
        });
    }
    
});


App.ApplicationController = App.mainController;