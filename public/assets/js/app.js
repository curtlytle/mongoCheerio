$(document).on("click", "#showNotes", function () {
    let thisId = $(this).attr("data-id");

    showNoteStuff(thisId);
});

function showNoteStuff(articleId) {
    $.ajax({
        method: "GET",
        url: "/articles/" + articleId
    })
        .done(function (data) {
            $("#notesModalTitle").empty();
            $("#notesModalTitle").append("<p>" + data.title + "</p>");

            $("#notesSection").empty();
            for (let i = 0; i < data.notes.length; i++) {
                let $div = $("<div>", {class: "note", text: data.notes[i].body});
                let $dbutton = $("<button>", {class: "btn btn-danger deletenotebutton", type: "button", text: 'X'});
                $dbutton.attr('data-id', data.notes[i]._id);
                $dbutton.attr('article-id', articleId);
                $div.append($dbutton);
                $("#notesSection").append($div);
            }
            if (data.notes.length == 0) {
                $("#notesModalTitle").append("<p>(No notes yet for this article)</p>");
            }

            $("#NoteText").val('');

            $("#modalfoot").empty();
            let $closeButton = $("<button>", {class: "btn btn-secondary", type: "button", text: "Close"});
            $closeButton.attr('data-dismiss', 'modal');
            let $saveButton = $("<button>", {class: "btn btn-primary", type: "button", text: "Save Note"});
            $saveButton.attr('article-id', data._id);
            $saveButton.attr('id', 'saveNoteButton');
            $saveButton.attr('data-dismiss', 'modal');

            $("#modalfoot").append($closeButton);
            $("#modalfoot").append($saveButton);
        });

}

$(document).on("click", "#deleteArticle", function () {
    let thisId = $(this).attr("data-id");

    $.ajax({
        method: "DELETE",
        url: "/deleteArticle/" + thisId
    })
        .done(function (data) {
            location.reload();
        });
});

$(document).on("click", ".deletenotebutton", function () {
    let noteId = $(this).attr("data-id");
    let articleId = $(this).attr("article-id");

    $.ajax({
        method: "DELETE",
        url: "/deleteNote/" + noteId
    })
        .done(function (data) {
            showNoteStuff(articleId);
        });
});

// When you click the savenote button
$(document).on("click", "#saveNoteButton", function () {
    // Grab the id associated with the article from the submit button
    let thisId = $(this).attr("article-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/saveArticleNote/" + thisId,
        data: {
            // Value taken from title input
            title: "KSL Article Note",
            // Value taken from note textareadata
            body: $("#NoteText").val()
        }
    })
    // With that done
        .done(function (data) {
            // Log the response
            console.log(data);
            // Empty the notes section
            $("#notes").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});

$(document).on("click", "#saveArticle", function () {
// Grab the id associated with the article from the submit button
    let thisId = $(this).attr("data-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/saveArticle/" + thisId,
        data: {
            // Value taken from title input
            title: $("#titleinput").val(),
            // Value taken from note textarea
            body: $("#bodyinput").val()
        }
    })
    // With that done
        .done(function (data) {
            // Log the response
            console.log(data);
            // Empty the notes section
            $("#notes").empty();
            location.reload();
        });
});

/*
$(document).on("click", "#savenote", function () {
    $("#testmodal").show();
});
*/
