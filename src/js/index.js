import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/***GLOBAL STATE OF THE APP
 * search object
 * current recipe object
 * shopping list object
 * liked recipe
*/
const state = {};

// SEARCH CONTROLLER
const controlSearch = async () => {
    // 1. get query from view
    const query = searchView.getInput();// TODO
    if(query){
        // 2. new search object and add to state
        state.search = new Search(query);
        // 3. prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            // 4. search for recipes 
        await state.search.getResults();
        // 5. render  results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        } catch (error) {
            alert('error at item search');
        }
        clearLoader();   
    }
}
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});
elements.searchResPages.addEventListener('click',e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});
// END OF SEARCH CONTROLLER

// RECIPE CONTROLLER
const controlRecipe = async () => {
    // get id from url
    const id = window.location.hash.replace('#','');
    if (id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe); 
        // highlight selected search items
        if( state.search ) {
            searchView.highlightSelected(id);
        }
        // create new recipe object
        state.recipe = new Recipe(id);
        try {
            // get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        // calculate serving and time
        state.recipe.calcPrepareTime();
        state.recipe.calcNumOfServing();
        // render recipe
        clearLoader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
            );
        } catch (error) {
            console.log(error);
        }
    }
};
// END OF RECIPE CONTROLLER

// LIST CONTROLLER
const controlList = () => {
    // create a new list if there is none yet
    if( !state.list ) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem( el.count, el.unit, el.ingredient );
        listView.renderItem(item); 
    });
};
// END OF LIST CONTROLLER

// Handle delete and update list item events
elements.shopping.addEventListener('click',e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.list.deleteItem(id);
        // delete from UI
        listView.deleteItem(id);
        // handle the count update 
    } else if(e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// LIKED CONTROLLER
const controlLike = () => {
    if( !state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // user has not yet liked the current recipe
    if( !state.likes.isLiked( currentID )) {
        // 1. add liked to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // 2. toggle the like button
        likesView.toggleLikeBtn(true);
        // 3. add like to UI
        likesView.renderLike(newLike);

    // user has liked the current recipe    
    } else {
        // 1. remove like from state
        state.likes.deleteLike(currentID);
        // 2. toggle the like button
        likesView.toggleLikeBtn(false);
        // 3. remove like from UI
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};
// END OF LIKED CONTROLLER

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    // Restore likes
    state.likes.readStorage();
    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// window.addEventListener('hashchange', controlRecipe); /** clicking on item title generates hashchange event
// window.addEventListener('load',controlRecipe); /** event generated while loading the same page

['hashchange','load'].forEach( event => window.addEventListener(event, controlRecipe));

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // minus button clicked
        if( state.recipe.servings > 1 ) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        };
    } else if ( e.target.matches('.btn-increase, .btn-increase *')) {
        // plus button clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if ( e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if( e.target.matches('.recipe__love, .recipe__love *')) {
        // liked controller
        controlLike();
    }
});


