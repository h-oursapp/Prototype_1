1.Login: DONE (PR #9)
    -add email and passwrod fields, not funcionality yet.
    - add the hours logo.

2.Onboarding:
    2.1.Add your skills: DONE (PR #10)
        -add here the a skill page.
        -continue should be disabled till there is one skill atleast.
        -skipp still possible for now.
    2.2.Add friends: DONE (PR #11)
        -add a input box for copying an friend/community link.
    2.3.Verify your identity: DONE (PR #12)
        -generate a random 5 digit number called verification code
        -show the code and the instructions for the verification process.
        -make the code fairly big.
        -button for take a picture of your face with a piece of paper that has a code on it.
        -the button opens the camera  so the user can take a picture with the code and their face.
        -for now save the pic locally call it verification pic.
        -during the prototype phase we dont actully verify anything.
        -skipping is possible
    2.4.How h_OURs works:
        -create a script that runs trough the motions of: home screen handling and trading, showing a full trade from clicking on the offer till the final review when the trade is closed.
        - we will need to record this as a video.
        -play the video here
    2.5.Profile picture: DONE (PR #13)
        -add a button to take a profile picture.
        -add a buttton to chose a picture from your phone.
        -skippable
    
3.Home: DONE (PR #8)
    -make the ads, your offers to the middle
    -change the arrow on the button to point to the right.
    -put the arrow button on the left and make it point to the left.
    -add swiping from left to right, opens your offers
    -add swiping from right to left, opens search
    -after the last of your offers or in the last grid space make a button to create new offer.
    -overlay the tiles with the name of the offer and the rating.

4.Nav bar: DONE (PR #8)
    -put home in the middle
    -remove settings from the nav bar, it is present inside the profile.
    -make the hours just big numbers no need for an icon. exp.: 10h15m
    - make the nav button floating, right know the nav bar place is blocked. Make it see so it gives back the space for the content.
    -about the navigation in general if possible make the back button go to main if its pressed on upper level page. (wallet,profile,trades,inventory,home,your offers,search). every other case it should work as default. exp.: open your offers -> click on web desing -> click back -> go back to your offers.
    -put some grid lines between the nav bar items.
    -time part doesnt need to be a square if it fits better it can take up 2 positions.

5.Profile: DONE (PR #5)
    -make the profile picture somewhat bigger
    -add a button after the recent reviews that open a the trades page with a filter for your offers and are already reviewed.
    - add to the skills a second rating called review rating.
    -the upper one is your rating of the skill, the lower is the review score.
    - review rating will be part of skills in general.
    -when clicked on a skill open a skill page #7

6.Skills: DONE (PR #5)
    -add review rating to the skills.
    -show both
    -when clicked on a skill open a skill page #7
    -make the add skill as a button. it opens an empty skill page #7. put the button on after the last skill in the grid
    -put the skills in a grid structure following the settings but with out limitaion how long is the grid. 
    -put the data inside the square. overlaying the picture.
    -add transferbox. only visible when the page is opened from offer creation.

7.Skill: DONE (PR #5)
    -show the skill logo the name the description both your rating and the review rating.
    -a button lets you edit your own skill.
    -when opened for skill creation it open empty data and in edit mode.
    -show recent reviews of this spesific skill.
    -get a button to show all trades of the spesific skill and already reviewed.

8.Ad -> Offer:
    -aka other peopels offers, let name them offer
    -we have 2 distinct offer types skill and material.
    - both should have at the details ratings shown, in case of skill both ratings.
    -in case of material offer show only a codition rating where 1 is only for parts/scrap, 5 is esectially new. this rating should be part of the offer creation proccess too.
    -when opened from create new offer button it opens empty and editable.
    -the use must chose if its a skill or an item. Put the buttons in the space of the big picture.
    -when its a skill navigate to the skills page the user can choose a skill.
    -on the skills  page there should be already a transfer box where the user can drag and drop the choosen skill.
    -when its a material navigate to the inventory page the user can choose an item.
    -on the inventory page there should be already a transfer box where the user can drag and drop the choosen item.
    -creating a new item/skill also should be possible from those pages already.
    -quick buy also opens the trade window but pre fills the time and scrolls put the focus on chat.

9.Inventory: DONE (PR #7)
    -we start from the almost the begining here.
    -make the items in a grid structure similar to main. make the page non scrollable. but make it page able.
    -only show the item name overlayed the picture.
    -add a button next to the shelf button that lets the user create a new item.
    -Shelfs are just a special item. it lest you create a named inventory space that opens a new page of the inventory.
    -For the prototype shelfs are not in scope.
    -on the bottom add a box for the drag a drop area call it transfer box

10.Item: DONE (PR #7)
    -new page Item
    -item represents an item in your inventory.
    -looks similar to the ad, plus public/private swich

11.Trading: DONE (PR #7)
    -put both your and the partners items in grids.
    -make the page non scrollable.
    -puts skills in a sigle row in a geparate grid
    -both for skills and items make the last gridcell a button for their respective pages
    -overlay the names and ratings
    - between your and your partners side make the trading area, both are single row.
    -the first block in the row shows time offered by opening it you can adjust(represent time as an inherent skill offer, not visible in the personal skills)
    -on the bottom have a chat window showing only the last message.
    -but its a scrollable area, on scrolling up extend the chat window to the full screen.
    -leave the extension button as is.
    -we need an accept trade button represent it with a green checkmark. I am not sure on the exact potition. for now put it inbetween in the middle.

12.Trades: DONE (PR #7)
    -add search bar and filters to the page. default filter open trades
    -order by date
    -when loading a closed trade show the ratings and the amount of reviews(if its a skill)
    -show a new message icon on the trading crads when there is an unread message.

13.Trading process: DONE (PR #7)
    -STATUS OF TRADE: not existing only as a page
    -the user clicks on an offer (from another user)
    -their they on either quick buy (name it to quick offer?) or trade
    -with both the user ends up on a trade screen. the screen has on the transfer table the chosen item preloaded.
    -with the quick offer it loads the time value and jumps to the chat (default offer pre typed?)
    -when the initiator makes an offer buyclicking an accept offer button or sends a message STATUS OF TRADE -> OPEN 
    -now the seller side need to either decline or accept the offer.
    -when declined the other side can make a new offer.
    -when accepted the trade is agreed on STATUS OF TRADE -> AGREED
    -from here the actual execution is up to the user ( calendar event feature ->  make note as open new feature)
    -after the trade went down the user should make a final review
    -highlight trades waiting for finalreview with green
    -when the final review is done STATUS OF TRADE -> CLOSED