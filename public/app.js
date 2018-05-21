$(document).ready(function () {
  console.log("DOC onload")
  $.getJSON("/scrape", function (scrapdata) {
    console.log("SCRAPING")
  })
});


$(document).on("click", "#showarticles", function () {
  $.getJSON("/articles", function (data) {
    console.log("Show articles Data length:" + data.length);
    $("#articles").empty();
    $("#notes").empty();
    for (var i = 0; i < data.length; i++) {
      // The title of the article
      if (data[i].saved === false) {
        $("#articles").append('<div class="panel panel-default"><div class="panel-heading"><h3><a class="article-link" target="_blank" href="' + data[i].link + '">' + data[i].title + '</a><a class="btn btn-danger save" id="' + data[i].articleId + '">SAVE ARTICLE</a></h3></div><div class="panel-body">' + data[i].summary + '</div></div>');
      }
    }

  });
});

$(document).on("click", "#savedarticles", function () {
  $.getJSON("/articles", function (data) {
    $("#articles").empty();
    $("#notes").empty();
    console.log("Saved articles Data length:" + data.length);
    for (var i = 0; i < data.length; i++) {
      // The title of the article
      if (data[i].saved === true) {
        $("#articles").append('<div class="panel panel-default"><div class="panel-heading"><h3><a class="article-link" target="_blank" href="' + data[i].link + '">' + data[i].title + '</a><a class="btn btn-danger delete" id="' + data[i].articleId + '">Delete from saved</a><a class="btn btn-danger note" id="' + data[i].articleId + '">Article notes</a></h3></div><div class="panel-body">' + data[i].summary + '</div></div>');
      }
    }

  });
});

$(document).on("click", ".save", function () {

  var thisId = $(this).attr("id");
  console.log("ID of the article to be saved:" + thisId);
  $.ajax({
    method: "POST",
    url: "/savearticle/" + thisId
  })
});

$(document).on("click", ".delete", function () {
  var thisId = $(this).attr("id");
  console.log("ID of the article to be deleted:" + thisId);
  $.ajax({
    method: "POST",
    url: "/deletearticle/" + thisId
  })
});

$(document).on("click", "#scrapenewarticles", function () {

  $("#articles").empty();
  $.getJSON("/scrapenewarticles", function (newarticles) {
    console.log("Saved articles Data length:" + newarticles.length);

    alert("YOU HAVE " + newarticles.length + " NEW ARTICLES!");
    for (var i = 0; i < newarticles.length; i++) {
      $("#articles").append('<div class="panel panel-default"><div class="panel-heading"><h3><a class="article-link" target="_blank" href="' + newarticles[i].link + '">' + newarticles[i].title + '</a><a class="btn btn-danger delete" id="' + newarticles[i].articleId + '">Delete from saved</a><a class="btn btn-danger note" id="' + newarticles[i].articleId + '">Article notes</a></h3></div><div class="panel-body">' + newarticles[i].summary + '</div></div>');
    }
  });
});

// Whenever someone clicks a p tag
$(document).on("click", ".note", function () {
  // Empty the notes from the note section
  // Save the id from the p tag
  var articleTitle = $(this).parent().find('a.article-link').text();
  console.log("Article note:" + articleTitle);
  // Now make an ajax call for the Article
  $("#articles").empty();
  $.ajax({
    method: "GET",
    url: "/getnote/" + articleTitle
  })
    // With that done, add the note information to the page
    .then(function (data) {
      $("#notes").empty();
      $("#notes").append("<h2>" + articleTitle + "</h2>");
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      $("#notes").append("<button id='savenote'>Save Note</button><br>");
      // The title of the article

      for (var i = 0; i < data.length; i++) {
        console.log("Notes of article:" + JSON.stringify(data[i]));
        // A textarea to add a new note body
        $("#notes").append("<textarea id=bodyinput" + i + " name='body' value='"+ data[i].body+"'>" + data[i].body + "</textarea>");
        // A button to submit a new note, with the id of the article saved to it
        // $("#notes").append("<button id='savenote'>Save Note</button>");
        $("#notes").append("<button class=deletenote id='deletenote" + i + "'>Delete Note</button><br>");
        // Place the body of the note in the body textarea
        $("#bodyinput" + i).val(data[i].body);
      }
    });
});
// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  console.log("saviing note fr article:" + thisId + ",article title:" + ($("h2").text()));
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/savenote/" + thisId,
    data: {
      articletitle: $("h2").text(),
      // Value taken from note textarea
      body: $("#bodyinput").val(),
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});


// When you click the deletenote button
$(document).on("click", ".deletenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("id");

  console.log("thisId:"+thisId);
  var bodyValue = "bodyinput"+thisId.substr(thisId.length - 1);
  console.log("bodyinput:"+bodyValue);

  var noteBody= document.getElementById(bodyValue).value;
  
console.log("NOTE TO be deleted:"+noteBody);
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/deletenote",
    data: {
      body: noteBody
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
    });

});
