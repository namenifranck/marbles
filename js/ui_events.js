/* global $, window, document */
/* global toTitleCase, connect_to_server, refreshHomePanel, closeNoticePanel, openNoticePanel, show_tx_step, marbles*/
/* global pendingTxDrawing:true */
/* exported record_company, autoCloseNoticePanel, start_up, block_ui_delay*/
var ws = {};
var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];
var autoCloseNoticePanel = null;
var known_companies = {};
var start_up = true;
var lsKey = 'marbles';
var fromLS = {};
var block_ui_delay = 15000; 								//default, gets set in ws block msg
var auditingMarble = null;

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function () {
	fromLS = window.localStorage.getItem(lsKey);
	if (fromLS) fromLS = JSON.parse(fromLS);
	else fromLS = { story_mode: false };					//dsh todo remove this
	console.log('from local storage', fromLS);

	connect_to_server();

	// =================================================================================
	// jQuery UI Events
	// =================================================================================


	// =================================================================================
	// FUNCTIONS
	// =================================================================================

	//-----------------------
	// fonctions permettant l'exécution du panier
	//-----------------------

	// ligne panier
	//-----------------------------------------
	function LignePanier (code, qte, prix)
	{
    this.codeArticle = code;
    this.qteArticle = qte;
    this.prixArticle = prix;
    this.ajouterQte = function(qte)
    {
        this.qteArticle += qte;
    }
    this.getPrixLigne = function()
    {
        var resultat = this.prixArticle * this.qteArticle;
        return resultat;
    }
    this.getCode = function()
    {
        return this.codeArticle;
    }
	}

	//gestion du panier
	//-----------------------------------------
	function Panier()
	{
    this.liste = [];
    this.ajouterArticle = function(code, qte, prix)
    {
        var index = this.getArticle(code);
        if (index == -1) this.liste.push(new LignePanier(code, qte, prix));
        else this.liste[index].ajouterQte(qte);
    }
    this.getPrixPanier = function()
    {
        var total = 0;
        for(var i = 0 ; i < this.liste.length ; i++)
            total += this.liste[i].getPrixLigne();
        return total;
    }
    this.getArticle = function(code)
    {
        for(var i = 0 ; i <this.liste.length ; i++)
            if (code == this.liste[i].getCode()) return i;
        return -1;
    }
    this.supprimerArticle = function(code)
    {
        var index = this.getArticle(code);
        if (index > -1) this.liste.splice(index, 1);
    }

		//get name of article
		this.getNameArticle = function(code)
    {
        var index = $.inArray(code, this.liste);
        return index;
    }

	}

	//-----------------------
	// End fonctions permettant l'exécution du panier
	//-----------------------

	// =================================================================================
	// END FUNCTIONS
	// =================================================================================


	//-----------------------
	// button ajouter panier
	//-----------------------
	$(document).on('click','#ajoutPanier',function(){

			//var listeNomArticle = ["Glamour","montres","Time","Wired","Young entrepreneur","CK-one-summer","guerlain-homme-ideal","guerlain-petiterobenoire","lancome-lveb","Scandal","akita-powerpack","bose-QC35","Montre-casio","kyutec-camerapen-1","LIF-Drumbass-1"];
			//var nomArticle = document.getElementById("hiddenArticle").value;
			var nomArticle = $('.nomArticle').text();
			var qte = parseInt(document.getElementById("qte").value);
			var prix = parseInt($('.nombreMiles').text());
			var code = parseInt(document.getElementById("id").value);
			//alert(nomArticle + ' '+qte+' '+nombreMiles+' '+code);

			var monPanier = new Panier();
      monPanier.ajouterArticle(code, qte, prix, nomArticle);
      var tableau = document.getElementById("tableau");
      //var longueurTab = parseInt(document.getElementById("nbreLignes").innerHTML);
			var longueurTab = parseInt(document.getElementById("nbreLignes").value);
					if (longueurTab > 0)
          {
            for(var i = longueurTab ; i > 0  ; i--)
            {
                monPanier.ajouterArticle(parseInt(tableau.rows[i].cells[0].innerHTML), parseInt(tableau.rows[i].cells[1].innerHTML), parseInt(tableau.rows[i].cells[2].innerHTML));
								tableau.deleteRow(i);
            }
          }
        var longueur = monPanier.liste.length;
          for(var i = 0 ; i < longueur ; i++)
        	{
              var ligne = monPanier.liste[i];
					    var ligneTableau = tableau.insertRow(-1);
              var colonne1 = ligneTableau.insertCell(0);
							colonne1.innerHTML += ligne.getCode();
							var colonne2 = ligneTableau.insertCell(1);
              colonne2.innerHTML += ligne.qteArticle;
              var colonne3 = ligneTableau.insertCell(2);
              colonne3.innerHTML += ligne.prixArticle;
              var colonne4 = ligneTableau.insertCell(3);
              colonne4.innerHTML += ligne.getPrixLigne();
							var colonne5 = ligneTableau.insertCell(4);
              colonne5.innerHTML += "<button id='retirerArticle' class=\"btn btn-primary\" > Retirer </button>";
					}

          document.getElementById("prixTotal").innerHTML = monPanier.getPrixPanier();
					document.getElementById("nbreLignes").value = longueur;
	});

//-------------------------------------------
// fonction permettant de retirer un article
//-------------------------------------------
	$(document).on('click','#retirerArticle',function(){

			//alert("rubrique retirer");
		$(this).closest('tr').remove();
		var myval = parseInt(document.getElementById("nbreLignes").value)-1;
		$("#nbreLignes").val(myval);
		var sum = 0;

		var table = $("table thead");

    table.find('tr').each(function (i) {

        var $tds = $(this).find('td'),
            code = $tds.eq(0).text(),
            Qte = $tds.eq(1).text(),
            prixUnitaire = $tds.eq(2).text();
						prixDeLaLigne = parseInt($tds.eq(3).text());


						if(!isNaN(prixDeLaLigne)){
								sum += prixDeLaLigne;
						}
        // do something with productId, product, Quantity
        // alert('Row ' + (i) + ':\nId: ' + code
        //       + '\nQuantity: ' + Qte
        //       + '\nPrice: ' + prixUnitaire
				// 		  + '\nTotal Price: ' + prixDeLaLigne
				// 			+ '\nSum Total Price: ' + sum);
    	});

		document.getElementById("prixTotal").innerHTML = sum;

		//$("#prixTotal").val();
		//alert( $("#nbreLignes").val() );

		// var monPanier = new Panier();
		// var tableau = document.getElementById("tableau");
		// var longueurTab = parseInt(document.getElementById("nbreLignes").innerHTML);
		//     if (longueurTab > 0)
		//     {
		//        for(var i = longueurTab ; i > 0  ; i--)
		//        {
		//           monPanier.ajouterArticle(parseInt(tableau.rows[i].cells[0].innerHTML), parseInt(tableau.rows[i].cells[1].innerHTML), parseInt(tableau.rows[i].cells[2].innerHTML));
		// 					tableau.deleteRow(i);
		//
		// 					var valueTest = tableau.rows[i].cells[0].innerHTML
		// 					alert(valueTest);
		//        }
		//     }
		// monPanier.supprimerArticle(code);
		// var longueur = monPanier.liste.length;
		//     for(var i = 0 ; i < longueur ; i++)
		//    	{
		//         var ligne = monPanier.liste[i];
		//         var ligneTableau = tableau.insertRow(-1);
		//         var colonne1 = ligneTableau.insertCell(0);
		//        	colonne1.innerHTML += ligne.getCode();
		//         var colonne2 = ligneTableau.insertCell(1);
		//         colonne2.innerHTML += ligne.qteArticle;
		//         var colonne3 = ligneTableau.insertCell(2);
		//         colonne3.innerHTML += ligne.prixArticle;
		//         var colonne4 = ligneTableau.insertCell(3);
		//         colonne4.innerHTML += ligne.getPrixLigne();
		//         var colonne5 = ligneTableau.insertCell(4);
		//         colonne5.innerHTML += "<button id='retirerArticle' class=\"btn btn-primary\" > Retirer </button>";
		//      }
		//    document.getElementById("prixTotal").innerHTML = monPanier.getPrixPanier();
		   //document.getElementById("nbreLignes").innerHTML = longueur;
			//  document.getElementById("nbreLignes").value = longueur;
	});

	//-------------------------------------------
	// Bouton permettant d'effectuer une commande
	//-------------------------------------------
	$(document).on('click','#Commander',function(){
			//alert("commander");
			var listeNomArticle = ["Glamour","montres","Time","Wired","Young entrepreneur","CK-one-summer","guerlain-homme-ideal","guerlain-petiterobenoire","lancome-lveb","Scandal","akita-powerpack","bose-QC35","Montre-casio","kyutec-camerapen-1","LIF-Drumbass-1"];
			var owner_id = document.getElementById('OwnerId').innerHTML.split(':')[1];

			// var content= '';

			var content = {
				'array': [],
				'state': true
			};

			var sum = 0;
			var table = $("table thead");
			var NprixDeLaLigne = 0;
	    table.find('tr').each(function (i) {
	        var $tds = $(this).find('td'),
	            code = $tds.eq(0).text(),
					 		index = parseInt(code),
					    Qte = $tds.eq(1).text(),
	            prixUnitaire = $tds.eq(2).text();
							NprixDeLaLigne = parseInt($tds.eq(3).text());
							// prixDeLaLigne = parseInt($tds.eq(3).text());
							prixDeLaLigne = '';
							nomArticle = '';

							if(!isNaN(index)){
									nomArticle = listeNomArticle[index-1];
									prixDeLaLigne = parseInt($tds.eq(3).text());
							}

							if(!isNaN(NprixDeLaLigne)){
									sum += NprixDeLaLigne;
							}

							if((code != '')){

								var panierContent = {
										Id: code,
										nom : nomArticle,
										quantite: Qte,
										prix_unitaire: prixUnitaire,
										prixDeLaLigne: sum
								};

								var obj = JSON.stringify(panierContent);

									// Content += '\nId:'+code
									// 					 +', Quantity:'+Qte
									// 					 +', Miles:'+prixUnitaire
									// 					 +', Total miles:'+prixDeLaLigne
									// 					 +', Article:'+nomArticle;
			        		// content.array.push ( "{"+'\"Id\": '+code+', \"Quantity\":'+Qte+', \"Miles\":'+prixUnitaire+', \"Total miles\":'+prixDeLaLigne+', \"Article\":'+ '\"'+nomArticle+'\"' +" } \n\t" );
									content.array.push(obj);


								// content.array.JSON.stringify ( "{"+'\"Id\": '+code+', \"Quantity\":'+Qte+', \"Miles\":'+prixUnitaire+', \"Total miles\":'+prixDeLaLigne+', \"Article\":'+ '\"'+nomArticle+'\"' +" } \n" )

							}

	        // do something with productId, product, Quantity
        // alert('Row ' + (i)
				// 			+ ':\nn° embarquement : ' + owner_id
				// 			+ '\nId: ' + code
        //       + '\nQuantity: ' + Qte
        //       + '\nPrice: ' + prixUnitaire
				// 		  + '\nTotal Price: ' + prixDeLaLigne
				// 			+	'\nNom article: ' +	nomArticle	);
			});

			// var jsonContent = JSON.parse(content);
								//  alert(jsonContent);
							// alert('\nn° embarquement:' + owner_id + csvContent+ '\nPrix Total du panier:' + sum);

					/*
					* json content
					*/
					// var csvContent = 'n° embarquement :'+ owner_id+ csvContent + '\nPrix Total du panier:' + sum ;





					// var obj = content.array;
					// var value = JSON.stringify(obj);

						 var AllContent = '{\n'
						 											 +'"n° embarquement":'+'\"'+owner_id+'\", \n'
																	 + '"Prix Total du panier":'+ sum +', \n'
																	 + '"Panier":[ \n'
																	 + content.array
																	 + '\n]'
																	 + '\n} ';
						 alert(AllContent);

							// var data = [["name1", "city1", "some other info"], ["name2", "city2", "more info"]];
							// //var csvContent = "data:text/csv;charset=utf-8,";
							// data.forEach(function(infoArray, index){
							// 		dataString = infoArray.join(",");
							// 		csvContent += index < data.length ? dataString+ "\n" : dataString;
							// });

						 /*
					   * Make CSV downloadable
					   */
						  try{

										if(content.array == "")
										{
											alert("Merci de selectionner des articles !!!");
										}
										else {
													var blob = new Blob(["\ufeff", AllContent], {type: "json"});
													saveAs(blob, "data.json");
										}
									// var downloadLink = document.createElement("a");
									// var url = URL.createObjectURL(blob);
								  // downloadLink.href = url;
								  // downloadLink.download = "data.csv";


						  /*
						   * Actually download CSV
						   */
								  // document.body.appendChild(downloadLink);
								  // downloadLink.click();
								  // document.body.removeChild(downloadLink);
							}

							catch(err){
					 				console.error(err);
							}
				});


	//-----------------------
	// image click event
	//-----------------------
	$(document).on('click','.img, .img_parfum, .img_electronique',function(){

		var data = $(this).attr('alt').split('_');
		var nomArticle = data[0];
		var nombreMiles = data[1];
		var code = data[2];
		var htmlButton = '&nbsp;&nbsp;<button id="ajoutPanier" class="btn btn-primary"> ajouter au panier </button>'
		var hiddencode = '&nbsp;&nbsp;<input type="hidden" id="id" value='+ code + '></input>'
		//alert(nomArticle + ' ' + nombreMiles + ' ' + code);
		$('#footer_content').html('<span class="detail">' + '<label>nom article : </label>'+ '<span class="nomArticle">'+ nomArticle +'</span>' + '&nbsp;&nbsp;<label>Quantité : <input type="number" id="qte" value=1 min=1 max=5 ></input>' + '</label> &nbsp;&nbsp;<label> nombre de point : </label>' + '<span class="nombreMiles">' +nombreMiles+ '</span>' + htmlButton + hiddencode +'</span>');

	});

	//-----------------------
	//end image click event
	//-----------------------

	$('#createMarbleButton').click(function () {
		console.log('creating marble');
		var obj = {
			type: 'create',
			color: $('.colorSelected').attr('color'),
			size: $('select[name="size"]').val(),
			username: $('select[name="user"]').val(),
			company: $('input[name="company"]').val(),
			owner_id: $('input[name="owner_id"]').val(),
			v: 1
		};
		console.log('creating marble, sending', obj);
		$('#createPanel').fadeOut();
		$('#tint').fadeOut();

		show_tx_step({ state: 'building_proposal' }, function () {
			ws.send(JSON.stringify(obj));

			refreshHomePanel();
			$('.colorValue').html('Color');											//reset
			for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			$('.createball').css('border', '2px dashed #fff');						//reset
		});

		return false;
	});

	//fix marble owner panel (don't filter/hide it)
	$(document).on('click', '.marblesFix', function () {
		if ($(this).parent().parent().hasClass('marblesFixed')) {
			$(this).parent().parent().removeClass('marblesFixed');
		}
		else {
			$(this).parent().parent().addClass('marblesFixed');
		}
	});

	//marble color picker
	$(document).on('click', '.colorInput', function () {
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on('click', '.colorOption', function () {
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color + '"></span>';

		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//remove prev color
		$('.createball').css('border', '0').addClass(color + 'bg');				//set new color
	});

	//username/company search
	$('#searchUsers').keyup(function () {
		var count = 0;
		var input = $(this).val().toLowerCase();
		for (var i in known_companies) {
			known_companies[i].visible = 0;
		}

		//reset - clear search
		if (input === '') {
			$('.marblesWrap').show();
			count = $('#totalUsers').html();
			$('.companyPanel').fadeIn();
			for (i in known_companies) {
				known_companies[i].visible = known_companies[i].count;
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				$('.companyPanel[company="' + i + '"]').find('.companyCount').html(known_companies[i].count);
			}
		}
		else {
			var parts = input.split(',');
			console.log('searching on', parts);

			//figure out if the user matches the search
			$('.marblesWrap').each(function () {												//iter on each marble user wrap
				var username = $(this).attr('username');
				var company = $(this).attr('company');
				if (username && company) {
					var full = (username + company).toLowerCase();
					var show = false;

					for (var x in parts) {													//iter on each search term
						if (parts[x].trim() === '') continue;
						if (full.indexOf(parts[x].trim()) >= 0 || $(this).hasClass('marblesFixed')) {
							count++;
							show = true;
							known_companies[company].visible++;								//this user is visible
							break;
						}
					}

					if (show) $(this).show();
					else $(this).hide();
				}
			});

			//show/hide the company panels
			for (i in known_companies) {
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				if (known_companies[i].visible === 0) {
					console.log('hiding company', i);
					$('.companyPanel[company="' + i + '"]').fadeOut();
				}
				else {
					$('.companyPanel[company="' + i + '"]').fadeIn();
				}
			}
		}
		//user count
		$('#foundUsers').html(count);
	});

	//login events
	$('#whoAmI').click(function () {													//drop down for login
		if ($('#userSelect').is(':visible')) {
			$('#userSelect').fadeOut();
			$('#carrot').removeClass('fa-angle-up').addClass('fa-angle-down');
		}
		else {
			$('#userSelect').fadeIn();
			$('#carrot').removeClass('fa-angle-down').addClass('fa-angle-up');
		}
	});

	//open create marble panel
	$(document).on('click', '.addMarble', function () {
		$('#tint').fadeIn();
		$('#createPanel').fadeIn();
		var company = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('company');
		var username = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('username');
		var owner_id = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('owner_id');
		var point = owner_id.substring(11,15);
		$('select[name="user"]').html('<option value="' + username + '">' + toTitleCase(username) + '</option>');
		$('input[name="company"]').val(company);
		$('input[name="owner_id"]').val(owner_id);

		//---------------------
		//info passager
		//---------------------
		$('#header_content').html('<label id=OwnerId> n° embarquement : ' + owner_id + '</label>'  + '&nbsp;&nbsp;<label> nom : ' + username + '</label>'  + '&nbsp;&nbsp;<label> nombre de miles : ' + point + '</label>');

		// initialisation de la variable cachée
		//---------------------------------------------
		document.getElementById("nbreLignes").value = 0;
		document.getElementById("prixTotal").innerHTML =' ';

				var table = $("table thead");

				table.find('tr').each(function (i) {
						var $tds = $(this).find('td'),
								code = $tds.eq(0).text(),
								index = parseInt(code),
								Qte = $tds.eq(1).text(),
								prixUnitaire = $tds.eq(2).text();
								prixDeLaLigne = parseInt($tds.eq(3).text());

								if(!isNaN(code) && !isNaN(Qte) && !isNaN(prixUnitaire) && !isNaN(prixDeLaLigne)){
										$(this).closest('tr').remove();
								}
				});


		//$("#tableau").empty();

	});

	//close create marble panel
	$('#tint').click(function () {
		if ($('#startUpPanel').is(':visible')) return;
		if ($('#txStoryPanel').is(':visible')) return;
		$('#createPanel, #tint, #settingsPanel').fadeOut();
	});

	//notification drawer
	$('#notificationHandle').click(function () {
		if ($('#noticeScrollWrap').is(':visible')) {
			closeNoticePanel();
		}
		else {
			openNoticePanel();
		}
	});

	//hide a notification
	$(document).on('click', '.closeNotification', function () {
		$(this).parents('.notificationWrap').fadeOut();
	});

	//settings panel
	$('#showSettingsPanel').click(function () {
		$('#settingsPanel, #tint').fadeIn();
	});
	$('#closeSettings').click(function () {
		$('#settingsPanel, #tint').fadeOut();
	});

	//story mode selection
	$('#disableStoryMode').click(function () {
		set_story_mode('off');
	});
	$('#enableStoryMode').click(function () {
		set_story_mode('on');
	});

	//close create panel
	$('#closeCreate').click(function () {
		$('#createPanel, #tint').fadeOut();
	});

	//change size of marble
	$('select[name="size"]').click(function () {
		var size = $(this).val();
		if (size === '16') $('.createball').animate({ 'height': 150, 'width': 150 }, { duration: 200 });
		else $('.createball').animate({ 'height': 250, 'width': 250 }, { duration: 200 });
	});

	//right click opens audit on marble
	$(document).on('contextmenu', '.ball', function () {
		auditMarble(this, true);
		return false;
	});

	//left click audits marble
	$(document).on('click', '.ball', function () {
		auditMarble(this, false);
	});

	function auditMarble(that, open) {
		var marble_id = $(that).attr('id');
		$('.auditingMarble').removeClass('auditingMarble');

		if (!auditingMarble || marbles[marble_id].id != auditingMarble.id) {//different marble than before!
			for (var x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);
			$('.txHistoryWrap').html('');										//clear
		}

		auditingMarble = marbles[marble_id];
		console.log('\nuser clicked on marble', marble_id);

		if (open || $('#auditContentWrap').is(':visible')) {
			$(that).addClass('auditingMarble');
			$('#auditContentWrap').fadeIn();
			$('#marbleId').html(marble_id);
			var color = marbles[marble_id].color;
			for (var i in bgcolors) $('.auditMarble').removeClass(bgcolors[i]);	//reset
			$('.auditMarble').addClass(color.toLowerCase() + 'bg');

			$('#rightEverything').addClass('rightEverythingOpened');
			$('#leftEverything').fadeIn();

			var obj2 = {
				type: 'audit',
				marble_id: marble_id
			};
			ws.send(JSON.stringify(obj2));
		}
	}

	$('#auditClose').click(function () {
		$('#auditContentWrap').slideUp(500);
		$('.auditingMarble').removeClass('auditingMarble');												//reset
		for (var x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);
		setTimeout(function () {
			$('.txHistoryWrap').html('<div class="auditHint">Click a Marble to Audit Its Transactions</div>');//clear
		}, 750);
		$('#marbleId').html('-');
		auditingMarble = null;

		setTimeout(function () {
			$('#rightEverything').removeClass('rightEverythingOpened');
		}, 500);
		$('#leftEverything').fadeOut();
	});

	$('#auditButton').click(function () {
		$('#auditContentWrap').fadeIn();
		$('#rightEverything').addClass('rightEverythingOpened');
		$('#leftEverything').fadeIn();
	});
});

//toggle story mode
function set_story_mode(setting) {
	if (setting === 'on') {
		fromLS.story_mode = true;
		$('#enableStoryMode').prop('disabled', true);
		$('#disableStoryMode').prop('disabled', false);
		$('#storyStatus').addClass('storyOn').html('on');
		window.localStorage.setItem(lsKey, JSON.stringify(fromLS));		//save
	}
	else {
		fromLS.story_mode = false;
		$('#disableStoryMode').prop('disabled', true);
		$('#enableStoryMode').prop('disabled', false);
		$('#storyStatus').removeClass('storyOn').html('off');
		window.localStorage.setItem(lsKey, JSON.stringify(fromLS));		//save
	}
}
