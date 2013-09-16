# exped.io

Trying to build an opinionated, but fast and pretty frontend for Expedia.

# Goals

1. Fast - Expedia is slow. Achieve this with slim templates and intelligent resource fetching. Possibly cache images in local mongodb.
2. Pretty - Expedia is ugly and cluttered. Achieve this with proper space between text and big images.
3. Usable - Expedia provides too many options I don't need. Remove them.
4. Calm - Expedia always pushes you to book now. That's stressful.

# Todo

* Wie für CompositeView Liste rausfinden, welche Elemente sichtbar sind und welche nicht? Am besten wäre ja mit scrollTop indexieren, geht aber schlecht weil wo? Marionette gibt da keine Schnittstelle. manuell rausholen geht irgendwie auch umständlich, sollte abe ram ehesten funktionieren.
* ordentliche startseite
* Schönes Hotel Template --> bilder!
* Sortieralgorithmus (schauen was bevorteilt wird mit dollar/rating)
* Bei Hotel Auswahl Pin click
* Selectbox für ergebnisse aktualisieren wenn map pan