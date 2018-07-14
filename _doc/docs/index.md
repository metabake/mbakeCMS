

## First steps to Meta

- Create a CodeAnywhere account

Use a WebIDE, to be a team player and remote friendly. (* _MetaBake_ pillar 9). Using CodeAnywhere (CA) connect to SSH or S3. To enable Pug, in the bottom right corner, next to indentation mark, click on the "editor mode" and select "Pug" from the list.


You can choose a commercial vendor to setup and co-host your Meta admin/build environments, or just use the open-source version. They are listed on Resources page (click on the left). Continue here with open source:

Create a Linux VM; install node.

      npm -g i nbake
      cd root
      # extract the starter admin app
      nbake -a
      cd admin     # /root/admin
      mkdir prod   # you'll mount your production app here


 We will later edit `admin.yaml` in this folder.

Now connect CodeAnywhere to /root (or whatever directory here) via SSH mount. Now CodeAnywhere is connected to your Meta admin/build; and soon it will be connected to your S3 production environment.

Continue next, or click Cloud Mount (on the right).



